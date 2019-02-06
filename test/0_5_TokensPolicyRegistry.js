const BigNumber = require("bignumber.js");

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

function createId(signature) {
    return web3.utils.keccak256(signature).substring(0, 10);
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract("TokensPolicyRegistry", accounts => {
    const precision = 1000000000000000000;
    const token_owner = accounts[0];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = new BigNumber(100).mul(precision);

    let CAT20Token;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let policyRegistry;

    let zeroAddress = "0x0000000000000000000000000000000000000000";
    let action = web3.utils.toHex("transfer");
    let policy = "0x020201636f756e7472790000000000000000000000000000000000000000000000000055530000000000000000000000000000000000000000000000000000000000000201636f756e747279000000000000000000000000000000000000000000000000005541000000000000000000000000000000000000000000000000000000000000010101697320766572696669656420496e766573746f720000000000000000000000007472756500000000000000000000000000000000000000000000000000000000";

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            zeroAddress,
            "Components Registry contract was not deployed"
        );

        policyRegistry = await TPR.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            policyRegistry.address.valueOf(),
            zeroAddress,
            "Tokens policy registry was not deployed"
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
        await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        let setP = createId("setPolicy(address,bytes32,bytes)");
        await permissionModule.addMethodToTheRole(setP, complianceRoleName, { from: accounts[0] });

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

        await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
    });

    describe("Policy tests", async() => {
        it("Set policy for the token", async() => {
            let tx = await policyRegistry.setPolicy(CAT20Token.address, action, policy, { from: accounts[0] });
            
            assert.equal(tx.logs[0].args.policy, policy);
        });

        it("Should fail to set policy from not authorized account", async() => {
            let errorThrown = false;
            try {
                await policyRegistry.setPolicy(CAT20Token.address, action, policy, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to set policy for invalid token address", async() => {
            let errorThrown = false;
            try {
                await policyRegistry.setPolicy(zeroAddress, action, policy, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid token address.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to set policy for invalid action", async() => {
            let errorThrown = false;
            try {
                await policyRegistry.setPolicy(CAT20Token.address, web3.utils.toHex(""), policy, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid action.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to set policy for invalid token", async() => {
            let errorThrown = false;
            try {
                await policyRegistry.setPolicy(permissionModule.address, action, policy, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Token is not registered in the tokens factory.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Returns policy for the token", async() => {
            let result = await policyRegistry.getPolicy(CAT20Token.address, action);

            assert.equal(policy, result);
        });

        it("Returns policy hash for the token", async() => {
            let result = await policyRegistry.getPolicyHash(CAT20Token.address, action);
            
            assert.equal(web3.utils.keccak256(policy, {encoding: "hex"}), result);
        });
    });
});