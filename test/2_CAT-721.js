const sleep = require('sleep');

var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var CAT721S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT721Token.sol");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteList.sol");
var CAT721V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT721Verification.sol");

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

contract("CAT721Token", accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = 0;

    const tokenId = 1;
    const testTokenId = 10;

    let CAT721Token;
    let whiteList;
    let transferModule;
    let CAT721Verification;
    let CAT721Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let txForRollback;

    let ownerRoleName = "Owner";
    let systemRoleName = "System";
    let registrationRoleName = "Registration";
    let issuerRoleName = "Issuer";
    let complianceRoleName = "Compliance";

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

        let tx;
        let status;

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

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

        let rollbackId = createId("createRollbackTransaction(address,address,address,uint256,uint256,string)");
        tx = await permissionModule.addMethodToTheRole(rollbackId, complianceRoleName, { from: accounts[0] });

        let mintId = createId("mint(address,uint256)");
        tx = await permissionModule.addMethodToTheRole(mintId, complianceRoleName, { from: accounts[0] });

        let cl = createId("clawback(address,address,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(cl, complianceRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

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

        CAT721Verification = await CAT721V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "CAT721Vierification contract was not deployed"
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

        CAT721Strategy = await CAT721S.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT721Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT721Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

        let standard = await CAT721Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT721Verification.address.valueOf(), standard);

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
        assert.notEqual(tx.receipt.logs[2].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.logs[2].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT721Token = await DSToken.at(tokenAddress);

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            SRStorage: ${SRStorage.address}
            TFStorage: ${TFStorage.address}
            PMStorage: ${PMStorage.address}
            TokensFactory: ${TokensFactory.address}
            CAT721Strategy: ${CAT721Strategy.address}
            CAT721Token: ${CAT721Token.address}
            WhiteList: ${whiteList.address}
            CAT721Vierification: ${CAT721Verification.address}
            TransferModule: ${transferModule.address}
            TCStorage: ${TCStorage.address}
            FCStorage: ${FCStorage.address}\n
        `);
    })

    describe("Testing CAT-721 token", async() => {
        it("Should add accounts to the whitelist", async() => {
            let complianceRoleName = "Compliance";

            let tx = await permissionModule.addRoleForSpecificToken(token_owner, CAT721Token.address.valueOf(), complianceRoleName, { from: accounts[0] });

            tx = await whiteList.addToWhiteList(token_owner, CAT721Token.address.valueOf(), { from: token_owner });

            tx = await whiteList.addToWhiteList(token_holder_1, CAT721Token.address.valueOf(), { from: token_owner });

            tx = await whiteList.addToWhiteList(token_holder_2, CAT721Token.address.valueOf(), { from: token_owner });
        });

        it("Should mint token", async() => {
            let tx = await CAT721Token.mint(token_holder_1, tokenId);

            assert.equal(tx.logs[0].args._to, token_holder_1);
            assert.equal(tx.logs[0].args._tokenId, tokenId);
        });

        it("Should fail mint token with the same token id", async() => {
            let errorThrown = false;
            try {
                await CAT721Token.mint(token_holder_1, tokenId);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Token id is busy.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should transfer tokens", async() => {
            let tx = await CAT721Token.transferFrom(token_holder_1, token_holder_2, tokenId, {from: token_holder_1});

            assert.equal(tx.logs[1].args._from, token_holder_1);
            assert.equal(tx.logs[1].args._to, token_holder_2);
            assert.equal(tx.logs[1].args._tokenId, tokenId);

            txForRollback = tx.tx;
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = await CAT721Token.balanceOf(token_holder_1);

            assert.equal(balance.toNumber(), 0);

            balance = await CAT721Token.balanceOf(token_holder_2);

            assert.equal(balance.toNumber(), 1);
        });

        it("Should rollback transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForRollback);
            let transaction = web3.eth.getTransaction(txForRollback);

            let checkpointId = parseInt(receipt.logs[0].topics[2]);
            
            await CAT721Token.createRollbackTransaction(token_holder_2, token_holder_1, transaction["from"], tokenId, checkpointId, txForRollback);

            let status = await CAT721Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });

    describe("Transactions checkpoints", async() => {
        it("Should change checkpoint expiration time", async() => {
            let newExpirationTime = 1;
            let expirationTime = await CAT721Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT721Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT721Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);
        });

        it("Should fial to create rollback transaction, checkpoint is expired", async() => {
            let tx = await CAT721Token.transferFrom(token_holder_1, token_holder_2, tokenId, {from: token_holder_1});
            
            assert.equal(tx.logs[1].args._from, token_holder_1);
            assert.equal(tx.logs[1].args._to, token_holder_2);
            assert.equal(tx.logs[1].args._tokenId, tokenId);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            sleep.msleep(1001);

            let errorThrown = false;
            try {
                await CAT721Token.createRollbackTransaction(token_holder_2, token_holder_1, token_holder_1, tokenId, checkpointId, txForRollback);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Checkpoint is already used or expired.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update checkpoint expiration time and create rollback transaction", async() => {
            let newExpirationTime = 600;
            let expirationTime = await CAT721Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT721Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT721Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);

            let tx = await CAT721Token.transferFrom(token_holder_2, token_holder_1, tokenId, {from: token_holder_2});
            
            assert.equal(tx.logs[1].args._from, token_holder_2);
            assert.equal(tx.logs[1].args._to, token_holder_1);
            assert.equal(tx.logs[1].args._tokenId, tokenId);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            await CAT721Token.createRollbackTransaction(token_holder_1, token_holder_2, token_holder_2, tokenId, checkpointId, txForRollback);

            let status = await CAT721Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });

        it("Clawback", async() => {
            let tx = await CAT721Token.mint(token_holder_1, testTokenId);

            assert.equal(tx.logs[0].args._to, token_holder_1);
            assert.equal(tx.logs[0].args._tokenId, testTokenId);

            tx = await CAT721Token.clawback(token_holder_1, token_holder_2, testTokenId, "", { from: token_owner });
            
            assert.equal(tx.logs[1].args.from, token_holder_1);
            assert.equal(tx.logs[1].args.to, token_holder_2);
            assert.equal(tx.logs[1].args.token, testTokenId);
        });

        it("Should fail to create clawback", async() => {
            let errorThrown = false;
            try {
                await CAT721Token.clawback(token_holder_2, token_holder_1, testTokenId, "", { from: token_holder_1 });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
    });
});