const BigNumber = require("bignumber.js");
const fs = require("fs");

var ID = artifacts.require('./registry-layer/identity/Identity.sol');
var TPR = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20/CAT20Token.sol");
var RE = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/RulesEngine.sol");
var CAT20TA = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT20TransferAction.sol");
var PP = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");

function createId(signature) {
    return web3.utils.keccak256(signature).substring(0, 10);
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract("RulesEngine", accounts => {
    const precision = 1000000000000000000;
    const token_owner = accounts[0];

    // Tokens details
    const name = "Securities Token";
    const symbol = "SEC";
    const name2 = "Securities Token 2";
    const symbol2 = "SEC-2";
    const decimals = 18;
    const totalSupply = new BigNumber(100).mul(precision);

    let identity;
    let rulesEngine;
    let policyParser;
    let CAT20TransferAction;
    let CAT20Token;
    let CAT20Token2;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let policyRegistry;

    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const action = "0xa9059cbb";
    // (country == US || country == UA) || (country == CA && verifiedInvestor == true)
    const policy = fs.readFileSync("./test/common/test-token-policy").toString();
    // country == US && country == UA
    const policy2 = fs.readFileSync("./test/common/test-token-policy-2").toString();
    const callData = "0xa9059cbb000000000000000000000000"+accounts[1].substr(2)+"0000000000000000000000000000000000000000000000008ac7230489e80000";

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            zeroAddress,
            "Components Registry contract was not deployed"
        );

        identity = await ID.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Identity contract was not deployed"
        );

        rulesEngine = await RE.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Rules Engine contract was not deployed"
        );

        policyParser = await PP.new(identity.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Policy parser contract was not deployed"
        );

        policyRegistry = await TPR.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            policyRegistry.address.valueOf(),
            zeroAddress,
            "Tokens policy registry was not deployed"
        );

        CAT20TransferAction = await CAT20TA.new(policyRegistry.address.valueOf(), policyParser.address.valueOf(), componentsRegistry.address.valueOf());
        assert.notEqual(
            policyRegistry.address.valueOf(),
            zeroAddress,
            "CAT20 Transfer action contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            zeroAddress,
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            zeroAddress,
            "PermissionModule contract was not deployed"
        );

        let ownerRoleName = web3.utils.toHex("Owner");
        let systemRoleName = web3.utils.toHex("System");
        let registrationRoleName = web3.utils.toHex("Registration");
        let issuerRoleName = web3.utils.toHex("Issuer");
        let complianceRoleName = web3.utils.toHex("Compliance");

        let tx;
        let status;

        tx = await componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

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
        await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        let setP = createId("setPolicy(address,bytes32,bytes)");
        await permissionModule.addMethodToTheRole(setP, complianceRoleName, { from: accounts[0] });
        
        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });
        
        let setAttr = createId("setWalletAttribute(address,bytes32,bytes32)");
        await permissionModule.addMethodToTheRole(setAttr, systemRoleName, { from: accounts[0] });

        let deleteAttr = createId("deleteWalletAttribute(address,bytes32)");
        await permissionModule.addMethodToTheRole(deleteAttr, systemRoleName, { from: accounts[0] });

        let setAE = createId("setActionExecutor(bytes32,address)");
        await permissionModule.addMethodToTheRole(setAE, systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], complianceRoleName, { from: accounts[0] });

        SRStorage = await ES.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            SRStorage.address.valueOf(),
            zeroAddress,
            "Symbol registry storage was not deployed"
        );

        symbolRegistry = await SR.new(componentsRegistry.address.valueOf(), SRStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            zeroAddress,
            "SymbolRegistry contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(symbolRegistry.address.valueOf());

        TFStorage = await TFS.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TFStorage.address.valueOf(),
            zeroAddress,
            "Tokens factory storage was not deployed"
        );

        TokensFactory = await TF.new(componentsRegistry.address.valueOf(), TFStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(TokensFactory.address.valueOf());

        CAT20Strategy = await CAT20S.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT20Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.rawLogs[0].topics.indexOf(topic), -1);

        let standard = await CAT20Strategy.getTokenStandard();

        let hexSymbol = web3.utils.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, web3.utils.toHex(""), { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
        assert.notEqual(tx.receipt.rawLogs[3].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.rawLogs[3].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT20Token = await DSToken.at(tokenAddress);

        let hexSymbol2 = web3.utils.toHex(symbol2);
        await symbolRegistry.registerSymbol(hexSymbol2, web3.utils.toHex(""), { from : token_owner });
            
        tx = await TokensFactory.createToken(name2, symbol2, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
        assert.notEqual(tx.receipt.rawLogs[3].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.rawLogs[3].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT20Token2 = await DSToken.at(tokenAddress);

        await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
        await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token2.address.valueOf(), complianceRoleName, { from: accounts[0] });

    });

    var countyAttr = "0x636f756e74727900000000000000000000000000000000000000000000000000";
    var US = "0x5553000000000000000000000000000000000000000000000000000000000000";
    var UA = "0x5541000000000000000000000000000000000000000000000000000000000000";

    var investorAttr = "0x697320766572696669656420496e766573746f72000000000000000000000000";
    var trueVal = "0x0100000000000000000000000000000000000000000000000000000000000000";

    describe("Rules Engine configuration", async() => {
        it("Set policy for the token", async() => {
            let tx = await policyRegistry.setPolicy(CAT20Token.address, action, policy, { from: accounts[0] });            
            assert.equal(tx.logs[0].args.policy, policy);
        });

        it("Set policy for the second token", async() => {
            let tx = await policyRegistry.setPolicy(CAT20Token2.address, action, policy2, { from: accounts[0] });            
            assert.equal(tx.logs[0].args.policy, policy2);
        });

        it("Returns policy length", async() => {
            let result = await policyRegistry.getPolicyLength(CAT20Token.address, action);

            assert.notEqual(result, 0);
        });

        it("Returns policy", async() => {
            let result = await policyRegistry.getPolicy(CAT20Token.address, action);

            assert.notEqual(result.length, 0);
        });

        it("Should set action executor", async() => {
            let tx = await rulesEngine.setActionExecutor(action, CAT20TransferAction.address.valueOf());
            assert.equal(tx.logs[0].args.executor, CAT20TransferAction.address.valueOf());
        });

        it("Can execute, without attributes not allowed", async() => {
            let result = await rulesEngine.canExecute(CAT20Token.address.valueOf(), accounts[1], callData);
            assert.equal(result[0], false);
        });

        it("Verify transfer without attributes, result false", async() => {
            let wallets = [accounts[1],zeroAddress,zeroAddress];
            let txDetailsAttributes = [];
            let txDetailsValues = [];
            for (let i = 0; i < 10; i++) {
                txDetailsAttributes.push(zeroAddress);
                txDetailsValues.push(zeroAddress);
            }

            let result = await policyParser.verifyPolicy(
                policy,
                wallets,
                txDetailsAttributes,
                txDetailsValues
            );
            assert.equal(result, false);
        });

        it("Should set new wallet attributes", async() => {
            await identity.setWalletAttribute(accounts[2], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[2], investorAttr, trueVal, { from: accounts[0] });

            await identity.setWalletAttribute(accounts[1], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[1], investorAttr, trueVal, { from: accounts[0] });

            await identity.setWalletAttribute(accounts[0], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[0], investorAttr, trueVal, { from: accounts[0] });

            await identity.setWalletAttribute(accounts[3], countyAttr, UA, { from: accounts[0] });

            await identity.setWalletAttribute(accounts[4], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[4], investorAttr, trueVal, { from: accounts[0] });
        });

        it("Verify transfer with attributes", async() => {
            let wallets = [accounts[1],zeroAddress,zeroAddress];
            let txDetailsAttributes = [];
            let txDetailsValues = [];
            for (let i = 0; i < 10; i++) {
                txDetailsAttributes.push(zeroAddress);
                txDetailsValues.push(zeroAddress);
            }
            
            let result = await policyParser.verifyPolicy(
                policy,
                wallets,
                txDetailsAttributes,
                txDetailsValues
            );
            assert.equal(result, true);
        });

        it("Verify transfer for policy with source and destination wallets (true)", async() => {
            let wallets = [accounts[0],accounts[3],zeroAddress];
            let txDetailsAttributes = [];
            let txDetailsValues = [];
            for (let i = 0; i < 10; i++) {
                txDetailsAttributes.push(zeroAddress);
                txDetailsValues.push(zeroAddress);
            }
            
            let result = await policyParser.verifyPolicy(
                policy2,
                wallets,
                txDetailsAttributes,
                txDetailsValues
            );
            assert.equal(result, true);
        });

        it("Verify transfer for policy with source and destination wallets (false)", async() => {
            let wallets = [accounts[0],accounts[1],zeroAddress];
            let txDetailsAttributes = [];
            let txDetailsValues = [];
            for (let i = 0; i < 10; i++) {
                txDetailsAttributes.push(zeroAddress);
                txDetailsValues.push(zeroAddress);
            }
            
            let result = await policyParser.verifyPolicy(
                policy2,
                wallets,
                txDetailsAttributes,
                txDetailsValues
            );
            assert.equal(result, false);
        });

        it("Can execute with attributes", async() => {
            let result = await rulesEngine.canExecute(CAT20Token.address.valueOf(), accounts[1], callData);
            assert.equal(result[0], true);
        });
    });

    describe("CAT-20 Transfer action", async() => {
        it("CAT-20 transfer verification without caching", async() => {
            let result = await CAT20TransferAction.verifyTransferWithoutCaching(
                accounts[1],
                accounts[2],
                accounts[1],
                CAT20Token.address.valueOf(),
                0,
                { from: accounts[0] }
            );

            assert.equal(result, true);
        });
        it("CAT-20 transfer and cache result", async() => {
            let tx = await CAT20TransferAction.verifyTransfer(
                accounts[1],
                accounts[2],
                accounts[1],
                CAT20Token.address.valueOf(),
                0,
                { from: accounts[0] }
            );

            assert.equal(tx.logs[0].args.who, accounts[1]);
            assert.equal(tx.logs[1].args.who, accounts[2]);
        });
        it("Should show that account is not cached", async() => {
            let result = await CAT20TransferAction.presentInWhiteList(accounts[4], CAT20Token.address.valueOf());

            assert.equal(result, false);
        });
        it("Should add account to the cache", async() => {
            let tx = await CAT20TransferAction.addToWhiteList(accounts[4], CAT20Token.address.valueOf());

            assert.equal(tx.logs[0].args.who, accounts[4]);
        });
        it("Should show that account is cached", async() => {
            let result = await CAT20TransferAction.presentInWhiteList(accounts[4], CAT20Token.address.valueOf());

            assert.equal(result, true);
        });
    });
});