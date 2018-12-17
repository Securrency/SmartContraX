const sleep = require('sleep');

var AR = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var ARS = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20/CAT20Token.sol");
var ESC = artifacts.require("./common/mocks/EscrowClient.sol");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteList.sol");
var CAT20V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT20Verification.sol");

var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.sha3(signature);

    return hash.substring(0, 10);
}

function bytes32ToString(bytes32) {
    return web3.toAscii(bytes32).replace(/\0/g, '')
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract("CAT20Token", accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = web3.toWei(10000, "ether");

    const toTransfer = web3.toWei(10, "ether");

    let CAT20Token;
    let whiteList;
    let transferModule;
    let CAT20Verification;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;
    let EscrowClient;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let txForRollback;

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components Registry contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PermissionModule contract was not deployed"
        );

        let ownerRoleName = "Owner";
        let systemRoleName = "System";
        let registrationRoleName = "Registration";
        let issuerRoleName = "Issuer";
        let complianceRoleName = "Compliance";

        let tx;
        let status;

        tx = componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

        tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(registrationRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(issuerRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(issuerRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(complianceRoleName, issuerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(complianceRoleName);
        assert.equal(status, true);

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });
        
        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        let cl = createId("clawback(address,address,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(cl, complianceRoleName, { from: accounts[0] });

        let mt = createId("mint(address,uint256)");
        tx = await permissionModule.addMethodToTheRole(mt, complianceRoleName, { from: accounts[0] });

        let iBurn = createId("issuerBurn(address,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(iBurn, complianceRoleName, { from: accounts[0] });

        let rollbackId = createId("createRollbackTransaction(address,address,address,uint256,uint256,string)");
        tx = await permissionModule.addMethodToTheRole(rollbackId, complianceRoleName, { from: accounts[0] });

        let enRoll = createId("toggleRollbacksStatus()");
        tx = await permissionModule.addMethodToTheRole(enRoll, complianceRoleName, { from: accounts[0] });

        let p = createId("pause()");
        tx = await permissionModule.addMethodToTheRole(p, complianceRoleName, { from: accounts[0] });

        let unp = createId("unpause()");
        tx = await permissionModule.addMethodToTheRole(unp, complianceRoleName, { from: accounts[0] });

        let crEscr = createId("createEscrow(address,address,uint256,bytes,bytes,bytes32,bool,bool)");
        tx = await permissionModule.addMethodToTheRole(crEscr, complianceRoleName, { from: accounts[0] });

        let canEscr = createId("cancelEscrow(bytes32,bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(canEscr, complianceRoleName, { from: accounts[0] });

        let ptEscr = createId("processEscrow(bytes32,address,bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(ptEscr, complianceRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        let createTApp = createId("createTokenApp(address,address)");
        tx = await permissionModule.addMethodToTheRole(createTApp, complianceRoleName, { from: accounts[0] });

        let removeTApp = createId("removeTokenApp(address,address)");
        tx = await permissionModule.addMethodToTheRole(removeTApp, complianceRoleName, { from: accounts[0] });

        let changeTAppStatus = createId("changeTokenAppStatus(address,address,bool)");
        tx = await permissionModule.addMethodToTheRole(changeTAppStatus, complianceRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], complianceRoleName, { from: accounts[0] });

        SRStorage = await ES.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            SRStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Symbol registry storage was not deployed"
        );

        symbolRegistry = await SR.new(componentsRegistry.address.valueOf(), SRStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(symbolRegistry.address.valueOf());

        TFStorage = await TFS.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TFStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Tokens factory storage was not deployed"
        );

        TokensFactory = await TF.new(componentsRegistry.address.valueOf(), TFStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(TokensFactory.address.valueOf());

        whiteList = await WL.new(componentsRegistry.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "WhiteList contract was not deployed"
        );

        CAT20Verification = await CAT20V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "CAT20Vierification contract was not deployed"
        );

        TCStorage = await TCS.new(componentsRegistry.address, { from: token_owner });
        assert.notEqual(
            TCStorage.address.valueOf(),
            zeroAddress,
            "TCStorage contract was not deployed"
        );

        FCStorage = await FCS.new(componentsRegistry.address, { from: token_owner });
        assert.notEqual(
            FCStorage.address.valueOf(),
            zeroAddress,
            "FCStorage contract was not deployed"
        );

        transferModule = await TM.new(componentsRegistry.address.valueOf(), TCStorage.address.valueOf(), FCStorage.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(transferModule.address.valueOf());

        CAT20Strategy = await CAT20S.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT20Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

        let standard = await CAT20Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
        assert.notEqual(tx.receipt.logs[3].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.logs[3].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT20Token = await DSToken.at(tokenAddress);

        EscrowClient = await ESC.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Escrow client contract was not deployed"
        );

        ARStorage = await ARS.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            ARStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Application registry storage contract was not deployed"
        );

        applicationsRegistry = await AR.new(componentsRegistry.address.valueOf(), ARStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            applicationsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Application registry contract was not deployed"
        );

        tx = await componentsRegistry.registerNewComponent(applicationsRegistry.address.valueOf(), { from: accounts[0] });
        assert.equal(tx.logs[0].args.componentAddress, applicationsRegistry.address.valueOf());

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            SRStorage: ${SRStorage.address}
            TFStorage: ${TFStorage.address}
            PMStorage: ${PMStorage.address}
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            CAT20Strategy: ${CAT20Strategy.address}
            CAT20Token: ${CAT20Token.address}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}
            TCStorage: ${TCStorage.address}
            FCStorage: ${FCStorage.address}
            EscrowClient: ${EscrowClient.address}\n
        `);
    })

    describe("Testing CAT-20 token", async() => {
        it("Should add accounts to the whitelist", async() => {
            let complianceRoleName = "Compliance";

            let tx = await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });

            tx = await whiteList.addToWhiteList(token_owner, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(token_holder_2, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(accounts[9], CAT20Token.address.valueOf(), { from: token_owner });
        })

        it("Should transfer tokens from the owner account to account " + token_holder_1, async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toTransfer);

            txForRollback = tx.tx;
        });

        it("Should transfer tokens from the owner account to account " + token_holder_2, async() => {
            let tx = await CAT20Token.transfer(token_holder_2, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_2);
            assert.equal(tx.logs[0].args.value.toNumber(), toTransfer);
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = await CAT20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance + toTransfer * 2, totalSupply);
        });

        it("Fail rollback transaction (rollback disabled)", async() => {
            try {
                let receipt = web3.eth.getTransactionReceipt(txForRollback);
                let transaction = web3.eth.getTransaction(txForRollback);
                let checkpointId = parseInt(receipt.logs[0].topics[2]);
                await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, transaction["from"], toTransfer, checkpointId, txForRollback);
            } catch (error) {

            }
        });

        it("Should enable rollbacks", async() => {
            let tx = await CAT20Token.toggleRollbacksStatus();

            assert.equal(tx.logs[0].args.newStatus, true);
        });

        it("Should transfer tokens with enabled rollbacks", async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toTransfer);

            txForRollback = tx.tx;
        });

        it("Should rollback transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForRollback);
            let transaction = web3.eth.getTransaction(txForRollback);

            let checkpointId = parseInt(receipt.logs[1].topics[2]);
            
            await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, transaction["from"], toTransfer, checkpointId, txForRollback);

            let status = await CAT20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });

        it("Should disable rollbacks", async() => {
            let tx = await CAT20Token.toggleRollbacksStatus();

            assert.equal(tx.logs[0].args.newStatus, false);
        });

        it("Should enable rollbacks", async() => {
            let tx = await CAT20Token.toggleRollbacksStatus();

            assert.equal(tx.logs[0].args.newStatus, true);
        });

        it("Mint tokens", async() => {
            let toMint = web3.toWei(20);
            let tx = await CAT20Token.mint(accounts[8], toMint);

            assert.equal(tx.logs[0].args.to, accounts[8]);
        });

        it("Should fail to mint tokens", async() => {
            let toMint = web3.toWei(1000);
            let errorThrown = false;
            try {
                await CAT20Token.mint(token_holder_2, toMint, { from: token_holder_2 });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to mint tokens for invalid address", async() => {
            let toMint = web3.toWei(1000);
            let errorThrown = false;
            try {
                await CAT20Token.mint("0x0000000000000000000000000000000000000000", toMint);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid recipient address.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to mint tokens with 0 amount", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.mint(token_holder_2, 0);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid amount.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should burn tokens", async() => {
            let toMint = web3.toWei(20);
            await CAT20Token.mint(token_holder_2, toMint);

            let tx = await CAT20Token.burn(toMint, { from: token_holder_2 });

            assert.equal(tx.logs[0].args.from, token_holder_2);
            assert.equal(tx.logs[0].args.value, toMint);
        });

        it("An issuer should burn tokens", async() => {
            let toMint = web3.toWei(20);
            await CAT20Token.mint(token_holder_2, toMint);

            let tx = await CAT20Token.issuerBurn(token_holder_2, toMint, "", { from: token_owner });

            assert.equal(tx.logs[0].args.from, token_holder_2);
            assert.equal(tx.logs[0].args.value, toMint);
        });

        it("Clawback", async() => {
            let tx = await CAT20Token.clawback(token_holder_2, accounts[9], toTransfer, "", { from: token_owner });

            assert.equal(tx.logs[0].args.from, token_holder_2);
            assert.equal(tx.logs[0].args.to, accounts[9]);
        });

        it("Should fail to create clawback", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.clawback(accounts[9], token_holder_2, toTransfer, "", { from: token_holder_2 });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should set token on pause", async() => {
            let tx = await CAT20Token.pause({ from: token_owner });

            assert.notEqual(tx.logs[0], "undefined");
        });

        it("Should be failed to transfer tokens", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.transfer(token_holder_1, toTransfer, { from: token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transactions are stoped by an issuer.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should be failed to transfer approved tokens", async() => {
            let toApprove = web3.toWei(1);
            await CAT20Token.approve(token_holder_1, toApprove, {from: token_owner});

            let errorThrown = false;
            try {
                await CAT20Token.transferFrom(token_owner, token_holder_1, toApprove, { from: token_holder_1 });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transactions are stoped by an issuer.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Must take off the pause", async() => {
            let tx = await CAT20Token.unpause({ from: token_owner });

            assert.notEqual(tx.logs[0], "undefined");
        });

        it("Should fialed to set token on pause", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.pause({ from: accounts[9] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");

        });
    });

    describe("Transactions checkpoints", async() => {
        it("Should change checkpoint expiration time", async() => {
            let newExpirationTime = 1;
            let expirationTime = await CAT20Token.expirationInterval();
            expirationTime = expirationTime.toNumber();

            await CAT20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT20Token.expirationInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);
        });

        it("Should fial to create rollback transaction, checkpoint is expired", async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[1].args.checkpointId.toNumber();

            sleep.msleep(1001);

            let errorThrown = false;
            try {
                await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, token_holder_1, toTransfer, checkpointId, tx.tx);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Checkpoint is already used or expired.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update checkpoint expiration time and create rollback transaction", async() => {
            let newExpirationTime = 600;
            let expirationTime = await CAT20Token.expirationInterval();
            expirationTime = expirationTime.toNumber();

            await CAT20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT20Token.expirationInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);

            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[1].args.checkpointId.toNumber();

            await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, token_owner, toTransfer, checkpointId, tx.tx);

            let status = await CAT20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });

    describe("Token applications registry", async() => {
        it("Should create application", async() => {
            let tx = await applicationsRegistry.createTokenApp(accounts[9], CAT20Token.address.valueOf(), { from: accounts[0] });
            let topic = "0x2f85b928a9cc622e7ffb326ec0eb8e31f4f488ad85e2172b43286226cd199754";
            assert.equal(tx.receipt.logs[0].topics[0], topic);
        });

        it("Should show that token application is active", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], CAT20Token.address.valueOf(), { from: accounts[0] });
            assert.equal(result, true);
        });

        it("Should set an token application on pause", async() => {
            let tx = await applicationsRegistry.changeTokenAppStatus(accounts[9], CAT20Token.address.valueOf(), false, { from: accounts[0] });      
            let topic = "0x41dd6d1e5064cee24756b27b96f5dde774df1939f69b9a9266f7b0a2a6f6fd0f";
            assert.equal(tx.receipt.logs[0].topics[0], topic);
        });
        
        it("Should show that application is not active", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], CAT20Token.address.valueOf(), { from: accounts[0] });
            assert.equal(result, false);
        });

        it("Should move an token application from the pause", async() => {
            let tx = await applicationsRegistry.changeTokenAppStatus(accounts[9], CAT20Token.address.valueOf(), true, { from: accounts[0] });
            let topic = "0x41dd6d1e5064cee24756b27b96f5dde774df1939f69b9a9266f7b0a2a6f6fd0f";
            assert.equal(tx.receipt.logs[0].topics[0], topic);
        });

        it("Should show that application is not registered", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[8], accounts[8], { from: accounts[0] });
            assert.equal(result, false);
        });

        it ("Should returns list of registered applications for the particular token", async() => {
            let result = await ARStorage.getTokenApplications(CAT20Token.address.valueOf());

            assert.notEqual(result.indexOf(accounts[9]), -1);
            assert.equal(result.indexOf(accounts[8]), -1);
        });

        it ("Should remove application from the token registry", async() => {
            let tx = await applicationsRegistry.removeTokenApp(accounts[9], CAT20Token.address.valueOf(), { from: accounts[0] });            
            let topic = "0xea0c0fe2c332a549df82524a5b069a1155e094effb2a78ee24a78c2deaa01440";
            assert.equal(topic, tx.receipt.logs[0].topics[0]);
        });

        it("Should show that removed application is not registered", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], CAT20Token.address.valueOf(), { from: accounts[0] });
            assert.equal(result, false);
        });

        it ("Should return empty list of the registred applications", async() => {
            let result = await ARStorage.getCATApplications();
            assert.equal(result.length, 0);
        });

        it ("Should register escrow client app", async() => {
            let tx = await applicationsRegistry.createTokenApp(EscrowClient.address.valueOf(), CAT20Token.address.valueOf(), { from: accounts[0] });
            let topic = "0x2f85b928a9cc622e7ffb326ec0eb8e31f4f488ad85e2172b43286226cd199754";
            assert.equal(tx.receipt.logs[0].topics[0], topic);
        });
    });

    describe("CAT-20 Escrow", async() => {
        var escrowId;
        var toMint = web3.toWei(20);
        var externalId = web3.toHex("test-external-id");
        it("Should move tokens to escrow", async() => {
            await CAT20Token.mint(token_holder_1, toMint);

            let onEscrow = await CAT20Token.getTokensOnEscrow(token_holder_1);
            assert.equal(onEscrow, 0);

            let tx = await CAT20Token.createEscrow(
                token_holder_1,
                EscrowClient.address,
                toMint / 2,
                web3.toHex("."),
                web3.toHex("."),
                externalId,
                true,
                true,
                { from: token_holder_1 }
            );
            
            escrowId = parseInt(tx.logs[0].args.escrowId);
            assert.equal(tx.logs[0].args.tokenHolder, token_holder_1);
        });

        it("Should fail to create escrow from with the same external id", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.createEscrow(
                    token_holder_1,
                    EscrowClient.address,
                    toMint / 5,
                    web3.toHex("."),
                    web3.toHex("."),
                    externalId,
                    false,
                    true,
                    { from: token_holder_1 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Retuns correct number of tokens on escrow", async() => {
            let modvedToEscrow = web3.toWei(10);

            let onEscrow = await CAT20Token.getTokensOnEscrow(token_holder_1);

            assert.equal(onEscrow, modvedToEscrow);
        });

        it("Retuns correct number of the external calls (created)", async() => {
            let created = await EscrowClient.created();
            assert.equal(parseInt(created), 1);
        });
        
        it("Should cancel an escrow", async() => {
            let tx = await CAT20Token.cancelEscrow(
                externalId,
                web3.toHex("."),
                web3.toHex("."),
                { from: token_holder_1 }
            );
            
            assert.equal(tx.logs[0].args.canceledBy, token_holder_1);
        });

        it("Retuns correct number of the external calls (canceled)", async() => {
            let canceled = await EscrowClient.canceled();
            assert.equal(parseInt(canceled), 1);
        });

        it("Retuns correct number of tokens on escrow after cancellation", async() => {
            let onEscrow = await CAT20Token.getTokensOnEscrow(token_holder_1);

            assert.equal(onEscrow, 0);
        });

        var externalId2 = web3.toHex("test-external-id-2");
        it("Should create one more escrow", async() => {
            
            let tx = await CAT20Token.createEscrow(
                token_holder_1,
                EscrowClient.address,
                toMint / 2,
                web3.toHex("."),
                web3.toHex("."),
                externalId2,
                false,
                true,
                { from: token_holder_1 }
            );
            
            escrowId = parseInt(tx.logs[0].args.escrowId);
            assert.equal(tx.logs[0].args.tokenHolder, token_holder_1);
        });

        it("Token holder should fail to cancel escrow", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.cancelEscrow(
                    externalId2,
                    web3.toHex("."),
                    web3.toHex("."),
                    { from: token_holder_1 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Cancelation is not allowed for the token holder.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Token holder should fail to process escrow", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.processEscrow(
                    externalId2,
                    token_holder_2,
                    web3.toHex("."),
                    web3.toHex("."),
                    { from: token_holder_1 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Processing is not allowed for the token holder.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should returns escrow status", async() => {
            let status = await CAT20Token.getEscrowStatus(escrowId);
            
            assert.equal(status, "0x01");
        });

        it("Escrow agent represented by smart contract should cancel escrow", async() => {
            await EscrowClient.triggerCanceled(externalId2);
            let status = await CAT20Token.getEscrowStatus(escrowId);
            assert.equal(status, "0x04");
        });

        it("Retuns correct number of the external calls (canceled)", async() => {
            let canceled = await EscrowClient.canceled();
            assert.equal(parseInt(canceled), 1);
        });

        var externalId3 = web3.toHex("test-external-id-3");
        it("Should create one more escrow", async() => {
            let tx = await CAT20Token.createEscrow(
                token_holder_1,
                EscrowClient.address,
                toMint / 2,
                web3.toHex("."),
                web3.toHex("."),
                externalId3,
                false,
                true,
                { from: token_holder_1 }
            );
            
            escrowId = parseInt(tx.logs[0].args.escrowId);
            assert.equal(tx.logs[0].args.tokenHolder, token_holder_1);
        });

        it("Escrow agent represented by smart contract should process escrow", async() => {
            await EscrowClient.triggerProcessed(externalId3, token_holder_2);
            let status = await CAT20Token.getEscrowStatus(escrowId);
            assert.equal(status, "0x02");

            balance = await CAT20Token.balanceOf(token_holder_2);
            assert.notEqual(balance, 0);
        });

        it("Retuns correct number of tokens on escrow after processing", async() => {
            let onEscrow = await CAT20Token.getTokensOnEscrow(token_holder_1);

            assert.equal(onEscrow, 0);
        });

        it("Should fail to create escrow from not authorized account", async() => {
            let errorThrown = false;
            let externalId4 = web3.toHex("test-external-id-4");
            try {
                await CAT20Token.createEscrow(
                    token_holder_1,
                    EscrowClient.address,
                    toMint / 2,
                    web3.toHex("."),
                    web3.toHex("."),
                    externalId4,
                    false,
                    true,
                    { from: token_holder_2 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        var externalId6 = web3.toHex("test-external-id-6");
        it("Should create one more escrow from the escrow agent account", async() => {
            await CAT20Token.mint(token_holder_1, toMint);
            let tx = await CAT20Token.createEscrow(
                token_holder_1,
                "",
                toMint / 2,
                web3.toHex("."),
                web3.toHex("."),
                externalId6,
                false,
                false,
                { from: accounts[0] }
            );
            
            escrowId = parseInt(tx.logs[0].args.escrowId);
            assert.equal(tx.logs[0].args.tokenHolder, token_holder_1);
        });

        it("Should fail to cancel escrow created by an escrow agent", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.cancelEscrow(
                    externalId6,
                    web3.toHex("."),
                    web3.toHex("."),
                    { from: token_holder_1 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Cancelation is not allowed for the token holder.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to process escrow created by an escrow agent", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.processEscrow(
                    externalId6,
                    token_holder_2,
                    web3.toHex("."),
                    web3.toHex("."),
                    { from: token_holder_1 }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Cancelation is not allowed for the token holder.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should process escrow created by the escrow agent", async() => {
            let tx = await CAT20Token.processEscrow(
                externalId6,
                token_holder_2,
                web3.toHex("."),
                web3.toHex("."),
                { from: accounts[0] }
            );
            
            assert.equal(tx.logs[1].args.to, token_holder_2);
        });
    });
});