var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var CAT1400S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-1400/CAT1400.sol");

var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.sha3(signature);

    return hash.substring(0, 10);
}

contract("CAT1400Token", accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = 0;

    const tokenId = 1;

    let CAT1400Token;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let txForRollback;

    let ownerRoleName = "Owner";
    let systemRoleName = "System";
    let registrationRoleName = "Registration";
    let issuerRoleName = "Issuer";
    let complianceRoleName = "Compliance";

    let tranche1 = web3.toHex("Gold");
    let tranche2 = web3.toHex("Silver");

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

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        // CAT-1400 methods
        let setDoc = createId("setDocument(bytes32,string,bytes32)");
        tx = await permissionModule.addMethodToTheRole(setDoc, complianceRoleName, { from: accounts[0] });

        let swCont = createId("swithControllable()");
        tx = await permissionModule.addMethodToTheRole(swCont, complianceRoleName, { from: accounts[0] });

        let swIssuable = createId("switchIssuable()");
        tx = await permissionModule.addMethodToTheRole(swIssuable, complianceRoleName, { from: accounts[0] });

        let issueBT = createId("issueByTranche(bytes32,address,uint256,bytes)");
        tx = await permissionModule.addMethodToTheRole(issueBT, complianceRoleName, { from: accounts[0] });

        let setDOFT = createId("setDefaultOperatorForTranche(bytes32,address)");
        tx = await permissionModule.addMethodToTheRole(setDOFT, complianceRoleName, { from: accounts[0] });
 
        let setDOpsFT = createId("setDefaultOperatorsForTranche(bytes32,address[])");
        tx = await permissionModule.addMethodToTheRole(setDOpsFT, complianceRoleName, { from: accounts[0] });

        let setDOps = createId("setDefaultOperators(address[])");
        tx = await permissionModule.addMethodToTheRole(setDOps, complianceRoleName, { from: accounts[0] });

        let setDO = createId("setDefaultOperator(address)");
        tx = await permissionModule.addMethodToTheRole(setDO, complianceRoleName, { from: accounts[0] });

        let reSO = createId("revokeSystemOperator(address)");
        tx = await permissionModule.addMethodToTheRole(reSO, complianceRoleName, { from: accounts[0] });

        let setDefTr = createId("setDefaultTranche(bytes32[])");
        tx = await permissionModule.addMethodToTheRole(setDefTr, complianceRoleName, { from: accounts[0] });
        
        let remDefTr = createId("removeDefaultTranche(bytes32)");
        tx = await permissionModule.addMethodToTheRole(remDefTr, complianceRoleName, { from: accounts[0] });

        let revDefOp = createId("revokeDefaultOperator(bytes32,address)");
        tx = await permissionModule.addMethodToTheRole(revDefOp, complianceRoleName, { from: accounts[0] });

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

        console.log('strategy before');
        CAT1400Strategy = await CAT1400S.new(componentsRegistry.address.valueOf(), { gas: 8000000 });
        console.log('strategy after');
        assert.notEqual(
            CAT1400Strategy.address.valueOf(),
            zeroAddress,
            "CAT1400Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT1400Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });

        let standard = await CAT1400Strategy.getTokenStandard();
        console.log('create token before');    
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        console.log('create token after');
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
        assert.notEqual(tx.receipt.logs[2].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.logs[2].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT1400Token = await DSToken.at(tokenAddress);

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            SRStorage: ${SRStorage.address}
            TFStorage: ${TFStorage.address}
            PMStorage: ${PMStorage.address}
            TokensFactory: ${TokensFactory.address}
            CAT1400Strategy: ${CAT1400Strategy.address}
            CAT-1400: ${CAT1400Token.address}\n
        `);
    });

    describe("Issuing and balances functions", async() => {
        let toIssue = web3.toWei(10);
        it("Should issue new tokens", async() => {
            let tx = await CAT1400Token.issueByTranche(tranche1, accounts[1], toIssue, "", { from: accounts[0] });

            assert.equal(tx.logs[2].args.to, accounts[1]);
            assert.equal(tx.logs[2].args.amount, toIssue);
        });

        it("Should fail to issue tokens. Not issuer account.", async() => {
            let throwError= false;
            try {
                await CAT1400Token.issueByTranche(tranche1, accounts[1], toIssue, "", { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should fail to issue tokens for invalid token holder", async() => {
            let throwError= false;
            try {
                await CAT1400Token.issueByTranche(tranche1, "0x0000000000000000000000000000000000000000", toIssue, "", { from: accounts[0] });
            } catch (error) {
                console.log(`         tx revert -> Invalid token holder address.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should fail to issue tokens for invalid tranche", async() => {
            let throwError= false;
            try {
                await CAT1400Token.issueByTranche("", accounts[1], toIssue, "", { from: accounts[0] });
            } catch (error) {
                console.log(`         tx revert -> Invalid tranche.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });
        
        it("Should issue new tokens for the new tranche", async() => {
            let tx = await CAT1400Token.issueByTranche(tranche2, accounts[2], toIssue, "", { from: accounts[0] });

            assert.equal(tx.logs[2].args.to, accounts[2]);
            assert.equal(tx.logs[2].args.amount, toIssue);
        });

        it("Should returns correct balance", async() => {
            let balance = await CAT1400Token.balanceOf(accounts[1]);
            assert.equal(balance, toIssue);
        });

        it("Should returns correct issuer balance", async() => {
            let balance = await CAT1400Token.balanceOf(accounts[0]);
            assert.equal(balance, 0);
        });

        it("Should returns correct balance by the tranche", async() => {
            let balance = await CAT1400Token.balanceOfTranche(accounts[1], tranche1);
            assert.equal(balance, toIssue);
        });

        it("Should returns correct issuer balance by the tranche", async() => {
            let balance = await CAT1400Token.balanceOfTranche(accounts[0], tranche1);
            assert.equal(balance, 0);
        });

        it("Returns issuable status", async() => {
            let status = await CAT1400Token.isIssuable();
            assert.equal(status, true);
        });

        it("Should change issuable status", async() => {
            await CAT1400Token.switchIssuable();
            let status = await CAT1400Token.isIssuable();
            assert.equal(status, false);
        });

        it("Should failed to chain issuable status. Not issuer account", async() => {
            let throwError= false;
            try {
                await CAT1400Token.switchIssuable({ from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should failed to issue new tokens", async() => {
            let throwError= false;
            try {
                await CAT1400Token.issueByTranche(tranche1, accounts[1], toIssue, "", { from: accounts[0] });
            } catch (error) {
                console.log(`         tx revert -> Issuance not allowed.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should change issuable status", async() => {
            await CAT1400Token.switchIssuable();
            let status = await CAT1400Token.isIssuable();
            assert.equal(status, true);
        });
    });

    describe("Tranches", async() => {
        it("Returns correct tranches quantity", async() => {
            let lenght = await CAT1400Token.getTranchesLength();
            assert.equal(lenght, 2);
        });

        it("Returns tranche by the index", async() => {
            let tranche = await CAT1400Token.getTrancheByIndex(0);
            let index = tranche.length - 1;

            while(tranche[index] == '0') {
                tranche = tranche.slice(0, -1);
                index--;
            }
            
            assert.equal(web3.toAscii(tranche), web3.toAscii(tranche1));
        });

        it("Should return list of the all tranches", async() => {
           let tranches = await CAT1400Token.getTranches();
           assert.equal(tranches.length, 2);
        });

        it("Should fail to set default tranches", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultTranche([tranche1], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should set tranches by default", async() => {
            let tx = await CAT1400Token.setDefaultTranche([tranche1, tranche2], { from: accounts[0] });
            let tranche = tx.logs[0].args.tranche;
            let index = tranche.length - 1; 
            while(tranche[index] == '0') {
                tranche = tranche.slice(0, -1);
                index--;
            }
            assert.equal(tranche, tranche1);
        });

        it("Returns list of the default tranches", async() => {
            let defaultTranches = await CAT1400Token.getDefaultTranches();
            assert.equal(defaultTranches.length, 2);
        });

        it("Should fail to remove default tranche", async() => {
            let throwError= false;
            try {
                await CAT1400Token.removeDefaultTranche(tranche1, { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should remove default tranche", async() => {
            let tx = await CAT1400Token.removeDefaultTranche(tranche2, { from: accounts[0] });
            let tranche = tx.logs[0].args.tranche;
            let index = tranche.length - 1; 
            while(tranche[index] == '0') {
                tranche = tranche.slice(0, -1);
                index--;
            }
            assert.equal(tranche, tranche2);
        });
    });

    describe("System opeartors (All holders, All tranches)", async() => {
        it("Should fail to add default operators", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperators([accounts[5], accounts[6]], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should fail to add default operator", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperator(accounts[5], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should set default operators", async() => {
            let tx = await CAT1400Token.setDefaultOperators([accounts[5], accounts[6]], { from: accounts[0] });
            assert.equal(tx.logs[0].args.operator, accounts[5]);
            assert.equal(tx.logs[1].args.operator, accounts[6]);
        });

        it("Should add one more default opeartor", async() => {
            let tx = await CAT1400Token.setDefaultOperator(accounts[7], { from: accounts[0] });
            assert.equal(tx.logs[0].args.operator, accounts[7]);
        });

        it("Should fail to add already added default operator", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperator(accounts[7], { from: accounts[0] });
            } catch (error) {
                console.log(`         tx revert -> System operator allready added.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Returns list of the system operators", async() => {
            let operators = await CAT1400Token.getSystemOperators();

            assert.notEqual(operators.indexOf(accounts[5]), -1);
            assert.notEqual(operators.indexOf(accounts[6]), -1);
            assert.notEqual(operators.indexOf(accounts[7]), -1);
        });

        it("Should fail to remove system operator", async() => {
            let throwError= false;
            try {
                await CAT1400Token.revokeSystemOperator(accounts[7], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should remove system operator", async() => {
            let tx = await CAT1400Token.revokeSystemOperator(accounts[7], { from: accounts[0] });
            assert.equal(tx.logs[0].args.operator, accounts[7]);
        });
    });

    describe("Tranche default operators (All holders, tranche)", async() => {
        it("Should fail to add tranche default operators", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperatorsForTranche(tranche1, [accounts[5]], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should fail to add tranche default operator", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperatorForTranche(tranche1, accounts[5], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should fail to add operator for not created default tranche", async() => {
            let throwError= false;
            try {
                await CAT1400Token.setDefaultOperatorForTranche("", accounts[5], { from: accounts[0] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Create default operators for tranche", async() => {
            let tx = await CAT1400Token.setDefaultOperatorsForTranche(tranche1, [accounts[7], accounts[8]]);

            assert.equal(tx.logs[0].args.operator, accounts[7]);
            assert.equal(tx.logs[1].args.operator, accounts[8]);
        });

        it("Create default operator for tranche", async() => {
            let tx = await CAT1400Token.setDefaultOperatorForTranche(tranche1, accounts[9]);

            assert.equal(tx.logs[0].args.operator, accounts[9]);
        });

        it("Returns list of the default tranche operators for tranche", async() => {
            let operators = await CAT1400Token.getDefaultTrancheOperators(tranche1);

            assert.notEqual(operators.indexOf(accounts[7]), -1);
            assert.notEqual(operators.indexOf(accounts[8]), -1);
            assert.notEqual(operators.indexOf(accounts[9]), -1);
        });

        it("Should fail to remove default tranche operator", async() => {
            let throwError= false;
            try {
                await CAT1400Token.revokeDefaultOperator(tranche1, accounts[7], { from: accounts[1] });
            } catch (error) {
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });

        it("Should remove default tranche operator", async() => {
            let tx = await CAT1400Token.revokeDefaultOperator(tranche1, accounts[7], { from: accounts[0] });
            assert.equal(tx.logs[0].args.operator, accounts[7]);
        });
    });

    describe("Transfers", async() => {
        it("Should transfer tokens in the tranche", async() => {
            let toTransfer = web3.toWei(1);
            let tx = await CAT1400Token.sendByTranche(tranche1, accounts[3], toTransfer, "", { from: accounts[1] });

            assert.equal(tx.logs[0].args.from, accounts[1]);
            assert.equal(tx.logs[0].args.to, accounts[3]);
        });

        it("Tranche opeartor should transfer tokens", async() => {
            let toTransfer = web3.toWei(1);
            let tx = await CAT1400Token.operatorSendByTranche(
                tranche1, 
                accounts[1], 
                accounts[3],
                toTransfer, 
                "",
                "", 
                { from: accounts[8] }
            );
            
            assert.equal(tx.logs[0].args.from, accounts[1]);
            assert.equal(tx.logs[0].args.to, accounts[3]);
        });

        it("System opeartor should transfer tokens", async() => {
            let toTransfer = web3.toWei(1);
            let tx = await CAT1400Token.operatorSendByTranche(
                tranche1, 
                accounts[1], 
                accounts[3],
                toTransfer, 
                "",
                "", 
                { from: accounts[5] }
            );
            
            assert.equal(tx.logs[0].args.from, accounts[1]);
            assert.equal(tx.logs[0].args.to, accounts[3]);
        });

        it("Should fail to transfer tokens", async() => {
            let throwError= false;
            try {
                await CAT1400Token.operatorSendByTranche(
                    tranche1, 
                    accounts[1], 
                    accounts[3],
                    toTransfer, 
                    "",
                    "", 
                    { from: accounts[0] }
                );
            } catch (error) {
                console.log(`         tx revert -> Operation not allowed.`.grey);
                throwError = true;
            }
            assert.ok(throwError, "Transaction should fail!");
        });
    });

    describe("ERC-20 backward compatible", async() => {
        it("transfer", async() => {
            let toTransfer = web3.toWei(1);
            let tx = await CAT1400Token.transfer(accounts[3], toTransfer, { from: accounts[1] });

            assert.equal(tx.logs[0].args.from, accounts[1]);
            assert.equal(tx.logs[0].args.to, accounts[3]);
        });

        it("balanceOf", async() => {
            let balane = await CAT1400Token.balanceOf(accounts[3]);
            assert.notEqual(parseInt(balane), 0);
        });

        it("approve", async() => {
            let toApprove = web3.toWei(1);
            let tx = await CAT1400Token.approve(accounts[3], toApprove, {from: accounts[1]});
            
            assert.equal(tx.logs[0].args.tokenOwner, accounts[1]);
            assert.equal(tx.logs[0].args.spender, accounts[3]);
            assert.equal(tx.logs[0].args.tokens.toNumber(), toApprove);
        });

        it("transferFrom", async() => {
            let toApprove = web3.toWei(1);
            let tx = await CAT1400Token.transferFrom(accounts[1], accounts[2], toApprove, {from: accounts[3]});

            assert.equal(tx.logs[1].args.from, accounts[1]);
            assert.equal(tx.logs[1].args.to, accounts[2]);
            assert.equal(tx.logs[1].args.tokens.toNumber(), toApprove);
        });
    });

    describe("ERC-777 backward compatible", async() => {
        it("Should add new operator", async() => {
            let tx = await CAT1400Token.authorizeOperator(accounts[2], { from: accounts[1] });

            assert.equal(tx.logs[0].args.operator, accounts[2]);
            assert.equal(tx.logs[0].args.tokenHolder, accounts[1]);
        });

        it("Operator will send tokens", async() => {
            let amount = await web3.toWei(1);

            let tx = await CAT1400Token.operatorSend(accounts[1], accounts[3], amount, "", "", { from: accounts[2] });

            assert.equal(tx.logs[0].args.operator, accounts[2]);
        });

        it("Should remove operator", async() => {
            let tx = await CAT1400Token.revokeOperator(accounts[2], { from: accounts[1] });

            assert.equal(tx.logs[0].args.operator, accounts[2]);
            assert.equal(tx.logs[0].args.tokenHolder, accounts[1]);
        });

        it("Operator should fail to transfer tokens", async() => {
            let amount = await web3.toWei(1);
            let throwError= false;
            try {
                await CAT1400Token.operatorSend(accounts[1], accounts[3], amount, "", "", { from: accounts[2] });
            } catch (error) {
                throwError = true;
            }

            assert.ok(throwError, "Transaction should fail!");
        });
    });
});