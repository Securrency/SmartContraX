var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20/CAT20Token.sol");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function bytes32ToString(bytes32) {
    return web3.toAscii(bytes32).replace(/\0/g, '')
}

function createId(signature) {
    let hash = web3.sha3(signature);

    return hash.substring(0, 10);
}

function makeId() {
    let possible = "abcdef0123456789";
    let id = "0x";
    for (var i = 0; i < 8; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

function makeRole() {
    let possible = "abcdefghijklmnopqrstuvwxyz";
    let role = "Role_";
    for (var i = 0; i < 5; i++) {
        role += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return role;
}

contract('PermissionModule', accounts => {
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;

    let owner = accounts[0];

    let ownerRoleName = "Owner";
    let systemRoleName = "System";
    let notExistingRole = "Not existing role";
    
    let testToken = "0x9d4770de60c5876cb0f3bb360803c35b700c6df4";

    let notSupportedMethod = "0x11111111";
    let testMethodIds = [];
    let testRoles = [];

    before(async() => {
        while(testMethodIds.length < 10) {
            testMethodIds.push(makeId());
        }

        while(testRoles.length < 25) {
            testRoles.push(makeRole());
        }

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
            "Permission module contract was not deployed"
        );

        let tx = componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

        let ownerRoleName = "Owner";
        let systemRoleName = "System";
        let registrationRoleName = "Registration";
        let issuerRoleName = "Issuer";

        let status;
        
        tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(registrationRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(issuerRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(issuerRoleName);
        assert.equal(status, true);

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(registrationRoleName, regSymbolId);
        assert.equal(status, true);

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(issuerRoleName, createTokenId);
        assert.equal(status, true);

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, addStrategyId);
        assert.equal(status, true);

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, regCompId);
        assert.equal(status, true);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], registrationRoleName);
        assert.equal(status, true);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], issuerRoleName);
        assert.equal(status, true);

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
            "0x0000000000000000000000000000000000000000",
            "TokensFactory contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(TokensFactory.address.valueOf());

        CAT20Strategy = await CAT20S.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CAT20Strategy contract was not deployed"
        ); 
        
        TCStorage = await TCS.new(componentsRegistry.address, { from: accounts[0] });
        assert.notEqual(
            TCStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TCStorage contract was not deployed"
        );

        FCStorage = await FCS.new(componentsRegistry.address, { from: accounts[0] });
        assert.notEqual(
            FCStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FCStorage contract was not deployed"
        );

        transferModule = await TM.new(componentsRegistry.address.valueOf(), TCStorage.address.valueOf(), FCStorage.address.valueOf(), { from: accounts[0] });
        assert.notEqual(
            transferModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TransferModule contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(transferModule.address.valueOf());

        tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : accounts[0] });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

        let standard = await CAT20Strategy.getTokenStandard();

        let symbol = "TEST";
        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : accounts[0] });
            
        tx = await TokensFactory.createToken("TEST NAME", symbol, 18, 100000000, standard, { from : accounts[0] });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
        assert.notEqual(tx.receipt.logs[3].topics.indexOf(topic), -1);
        testToken = tx.receipt.logs[3].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            testToken,
            "0x0000000000000000000000000000000000000000",
            "New token was not deployed"
        );

        tx = await permissionModule.removeMethodFromTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(registrationRoleName, regSymbolId);
        assert.equal(status, false);

        tx = await permissionModule.removeMethodFromTheRole(createTokenId, issuerRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(issuerRoleName, createTokenId);
        assert.equal(status, false);

        tx = await permissionModule.removeMethodFromTheRole(addStrategyId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, addStrategyId);
        assert.equal(status, false);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], issuerRoleName);
        assert.equal(status, false);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], registrationRoleName);
        assert.equal(status, false);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
        status = await PMStorage.verifyRole(accounts[0], systemRoleName);
        assert.equal(status, false);
    });

    describe("Test permission module adding and removals mechanism", async() => {
        it("Should create owner role on the deploy", async() => {
            let length = await PMStorage.getRolesLength();
            length = parseInt(length);

            let role;
            let roles = [];
            for (let i = 0; i < length; i++) {
                role = await PMStorage.getRoleByTheIndex(i);
                roles.push(bytes32ToString(role));
            }
            assert.equal(ownerRoleName, roles[0]);
        });

        it("Should create list of the roles", async() => {
            let tx;
            for (let i = 0; i < testRoles.length; i++) {
                tx = await permissionModule.createRole(testRoles[i], ownerRoleName, {from: owner});
                status = await PMStorage.getRoleStatus(testRoles[i]);
                assert.equal(status, true);
            }
        });

        it("Should add methods to the role", async() => {
            let tx;
            for (let i = 0; i < testMethodIds.length; i++) {
                tx = await permissionModule.addMethodToTheRole(testMethodIds[i], testRoles[0], { from: owner });
                status = await PMStorage.getMethodStatus(testRoles[0], testMethodIds[i]);
                assert.equal(status, true);
            }
        });

        it("Should correctly remove methods from the role", async() => {
            let methodsToRemove = testMethodIds.slice(0);
            
            let indexToRemove = Math.round(methodsToRemove.length / 2);

            let tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[indexToRemove], testRoles[0], { from: owner });
            status = await PMStorage.getMethodStatus(testRoles[0], methodsToRemove[indexToRemove]);
            assert.equal(status, false);
            
            methodsToRemove[indexToRemove] = methodsToRemove[methodsToRemove.length - 1];
            methodsToRemove.splice(methodsToRemove.length - 1, 1);

            tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[indexToRemove], testRoles[0], { from: owner });
            status = await PMStorage.getMethodStatus(testRoles[0], methodsToRemove[indexToRemove]);
            assert.equal(status, false);

            methodsToRemove[indexToRemove] = methodsToRemove[methodsToRemove.length - 1];
            methodsToRemove.splice(methodsToRemove.length - 1, 1);

            for (let i = 0; i < methodsToRemove.length; i++) {
                tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[i], testRoles[0], { from: owner });
                status = await PMStorage.getMethodStatus(testRoles[0], methodsToRemove[i]);
                assert.equal(status, false);
            }

            let length = await PMStorage.getMethodsLength(testRoles[0]);     
            assert.equal(length, 0)
        });

        it("Should add roles to the wallet", async() => {
            let tx;
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleToTheWallet(accounts[2], testRoles[i], { from: owner });
                status = await PMStorage.verifyRole(accounts[2], testRoles[i]);
                assert.equal(status, true);
            }
        });

        it("Should correctly remove roles from the wallet", async() => {
            let rolesToRemove = testRoles.slice(0);
            rolesToRemove.splice(20, 5);
            
            let indexToRemove = Math.round(rolesToRemove.length / 2);

            let tx = await permissionModule.removeRoleFromTheWallet(accounts[2], rolesToRemove[indexToRemove], { from: owner });
            status = await PMStorage.verifyRole(accounts[2], rolesToRemove[indexToRemove]);
            assert.equal(status, false);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);

            tx = await permissionModule.removeRoleFromTheWallet(accounts[2], rolesToRemove[indexToRemove], { from: owner });
            status = await PMStorage.verifyRole(accounts[2], rolesToRemove[indexToRemove]);
            assert.equal(status, false);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);
            
            for (let i = 0; i < 18; i++) {
                tx = await permissionModule.removeRoleFromTheWallet(accounts[2], rolesToRemove[i], { from: owner });
                status = await PMStorage.verifyRole(accounts[2], rolesToRemove[i]);
                assert.equal(status, false);
            }

            let walletRoles = await permissionModule.getWalletRoles(accounts[2]);
            
            for (i = 0; i < walletRoles.length; i++) {
                assert.equal(walletRoles[i], "0x0000000000000000000000000000000000000000000000000000000000000000");
            }
        });

        it("Should add roles for specific token", async() => {
            let tx;
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleForSpecificToken(accounts[2], testToken, testRoles[i], { from: owner });
                status = await PMStorage.getTokenDependentRoleStatus(accounts[2], testToken, testRoles[i]);
                assert.equal(status, true);
            }
        });

        it("Should correctly remove roles from the specific token", async() => {
            let rolesToRemove = testRoles.slice(0);
            rolesToRemove.splice(20, 5);
            
            let indexToRemove = Math.round(rolesToRemove.length / 2);

            let tx = await permissionModule.removeRoleFromSpecificToken(accounts[2], testToken, rolesToRemove[indexToRemove], { from: owner });
            status = await PMStorage.getTokenDependentRoleStatus(accounts[2], testToken, rolesToRemove[indexToRemove]);
            assert.equal(status, false);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);

            tx = await permissionModule.removeRoleFromSpecificToken(accounts[2], testToken, rolesToRemove[indexToRemove], { from: owner });
            status = await PMStorage.getTokenDependentRoleStatus(accounts[2], testToken, rolesToRemove[indexToRemove]);
            assert.equal(status, false);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);
            
            for (let i = 0; i < 18; i++) {
                tx = await permissionModule.removeRoleFromSpecificToken(accounts[2], testToken, rolesToRemove[i], { from: owner });
                status = await PMStorage.getTokenDependentRoleStatus(accounts[2], testToken, rolesToRemove[i]);
                assert.equal(status, false);
            }

            let walletRoles = await permissionModule.getWalletRolesForToken(accounts[2], testToken);
            
            for (i = 0; i < walletRoles.length; i++) {
                assert.equal(walletRoles[i], "0x0000000000000000000000000000000000000000000000000000000000000000");
            }
        });
    });

    describe("Test roles manager", async() => {
        it("Should fail to create new role with empty name", async() => {
            let errorThrown = false;
            try {
                await permissionModule.createRole("", ownerRoleName, {from: accounts[0]});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to create new role with empty parent name", async() => {
            let errorThrown = false;
            try {
                await permissionModule.createRole(systemRoleName, "", {from: accounts[0]});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid parent role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to create new role with existing name", async() => {
            let errorThrown = false;
            try {
                await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role already exists.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to create new role from not owner account", async() => {
            let errorThrown = false;
            try {
                await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[1]});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        // add method to the role
        it("Should fail to add method to the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addMethodToTheRole(testMethodIds[0], systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to add method to the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addMethodToTheRole(testMethodIds[0], "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to add method to the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addMethodToTheRole("", systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add method to the role", async() => {
            let tx = await permissionModule.addMethodToTheRole(testMethodIds[0], systemRoleName, { from: owner });
            status = await PMStorage.getMethodStatus(systemRoleName, testMethodIds[0]);
            assert.equal(status, true);
        });

        it("Should fail to add method to the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addMethodToTheRole(testMethodIds[0], systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Method already added to the role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add one more method to the role", async() => {
            let tx = await permissionModule.addMethodToTheRole(testMethodIds[1], systemRoleName, { from: owner });
            status = await PMStorage.getMethodStatus(systemRoleName, testMethodIds[1]);
            assert.equal(status, true);
        });

        // remove method from the role
        it("Should fail to remove a method from the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeMethodFromTheRole(testMethodIds[0], systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to remove a method from the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeMethodFromTheRole(testMethodIds[0], "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to remove a method from the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeMethodFromTheRole("", systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid method id.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to remove a method from the role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeMethodFromTheRole(notSupportedMethod, systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Method is not supported.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should remove a method from the role", async() => {
            status = await PMStorage.getMethodStatus(systemRoleName, testMethodIds[1]);
            assert.equal(status, true);

            let tx =await permissionModule.removeMethodFromTheRole(testMethodIds[1], systemRoleName, { from: owner });
            status = await PMStorage.getMethodStatus(systemRoleName, testMethodIds[1]);
            assert.equal(status, false);
        });

        // deactivate role
        it("Should fail to deactivate role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.deactivateRole(systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to deactivate role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.deactivateRole("", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to deactivate not existing role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.deactivateRole(notExistingRole, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should deactivate role", async() => {
            status = await PMStorage.getRoleStatus(systemRoleName);
            assert.equal(status, true);

            let tx = await permissionModule.deactivateRole(systemRoleName, { from: owner });

            status = await PMStorage.getRoleStatus(systemRoleName);
            assert.equal(status, false);
        });

        it("Should fail to deactivate not active role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.deactivateRole(systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role is not active.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        // activate role
        it("Should fail to activate role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.activateRole(systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to activate role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.activateRole("", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to activate not existing role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.activateRole(notExistingRole, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should activate role", async() => {
            status = await PMStorage.getRoleStatus(systemRoleName);
            assert.equal(status, false);

            let tx = await permissionModule.activateRole(systemRoleName, { from: owner });

            status = await PMStorage.getRoleStatus(systemRoleName);
            assert.equal(status, true);
        });

        it("Should fail to activate active role", async() => {
            let errorThrown = false;
            try {
                await permissionModule.activateRole(systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role is active.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
    });

    describe("Test network roles manager", async() => {
        // add role to the wallet
        it("Should fail add role to the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleToTheWallet(accounts[1], "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail add role to the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleToTheWallet(accounts[1], systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role management not allowed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add role to the wallet", async() => {
            let tx = await permissionModule.addRoleToTheWallet(accounts[1], systemRoleName, { from: owner });
            status = await PMStorage.verifyRole(accounts[1], systemRoleName);
            assert.equal(status, true);
        });

        it("Should fail add role to the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleToTheWallet(accounts[1], systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role already added.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        // verify permission
        it("Should allow access to the method", async() => {
            let result = await permissionModule.allowedForWallet(testMethodIds[0], accounts[1], { from: owner });
            assert.equal(result, true);
        });

        it("Should decline access to the method", async() => {
            let result = await permissionModule.allowedForWallet(testMethodIds[2], accounts[1], { from: owner });
            assert.equal(result, false);
        });

        // roles limit
        it("Should fail when wallet roles limit will be reached", async() => {
            let tx;
            // add roles to the account
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleToTheWallet(accounts[4], testRoles[i], { from: owner });
                status = await PMStorage.verifyRole(accounts[4], testRoles[i]);
                assert.equal(status, true);
            }
            
            let errorThrown = false;
            try {
                await permissionModule.addRoleToTheWallet(accounts[4], testRoles[21], { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> The limit for number of roles has been reached.`.grey);
                assert(isException(error), error.toString());
            }

            assert.ok(errorThrown, "Transaction should fail!");
        });

        // remove role
        it("Should fail remove role from the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromTheWallet(accounts[1], notExistingRole, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> The wallet has no this role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail remove role from the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromTheWallet(accounts[1], "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail remove role from the wallet", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromTheWallet(accounts[1], systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role management not allowed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should remove role from the wallet", async() => {
            let tx = await permissionModule.removeRoleFromTheWallet(accounts[1], systemRoleName, { from: owner });
            status = await PMStorage.verifyRole(accounts[1], systemRoleName);
            assert.equal(status, false);
        });

        // verify permission
        it("Should decline access to the method after role removing", async() => {
            let result = await permissionModule.allowedForWallet(testMethodIds[0], accounts[1], { from: owner });
            assert.equal(result, false);
        });

        // transfer ownership
        it("Should fail transfer ownership", async() => {
            let errorThrown = false;
            try {
                await permissionModule.transferOwnership(accounts[1], { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail transfer ownership", async() => {
            let errorThrown = false;
            try {
                await permissionModule.transferOwnership("", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid new owner address.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should transfer ownership", async() => {
            let tx = await permissionModule.transferOwnership(accounts[1], { from: owner });
            let topic = "0x1399338fbdd61ce69ad7a59b8913751ad69b17ec3e2dd9cf2bb5dc5caea2ea8b";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Should be failed to accept ownership from an account without permission", async() => {
            let errorThrown = false;
            try {
                await permissionModule.acceptOwnership({ from: accounts[2] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should accept ownership", async() => {
            let tx = await permissionModule.acceptOwnership({ from: accounts[1] });
            status = await PMStorage.verifyRole(accounts[1], "Owner");
            assert.equal(status, true);
        });

        it("Should fail execute ownable method from old onwer account", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleToTheWallet(accounts[2], systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Allowed only for the owner.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should execute ownable method from new onwer account", async() => {
            let tx = await permissionModule.addRoleToTheWallet(accounts[3], systemRoleName, { from: accounts[1] });
            status = await PMStorage.verifyRole(accounts[3], systemRoleName);
            assert.equal(status, true);
        });

        it("Should transfer ownership back to the previous owner", async() => {
            let tx = await permissionModule.transferOwnership(owner, { from: accounts[1] });
            let topic = "0x1399338fbdd61ce69ad7a59b8913751ad69b17ec3e2dd9cf2bb5dc5caea2ea8b";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Previous owner should accept ownership", async() => {
            let tx = await permissionModule.acceptOwnership({ from: owner });
            status = await PMStorage.verifyRole(owner, "Owner");
            assert.equal(status, true);
        });

        it("Should execute ownable method from new onwer account", async() => {
            let tx = await permissionModule.removeRoleFromTheWallet(accounts[3], systemRoleName, { from: owner });
            status = await PMStorage.verifyRole(accounts[3], systemRoleName);
            assert.equal(status, false);
        });
    });

    describe("Test token roles manager", async() => {
        // add role to the wallet
        it("Should fail add role for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[0], testToken, "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail add role for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[0], testToken, systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role management not allowed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add role for a specific token", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(accounts[0], testToken, systemRoleName, { from: owner });
            status = await PMStorage.getTokenDependentRoleStatus(accounts[0], testToken, systemRoleName);
            assert.equal(status, true);
        });

        it("Should fail add role for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[0], testToken, systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role already added.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        // verify permission
        it("Should allow access to the method for a specific token", async() => {
            let result = await permissionModule.allowed(testMethodIds[0], accounts[0], testToken, { from: owner });
            assert.equal(result, true);
        });

        it("Should decline access to the method for a specific token", async() => {
            let result = await permissionModule.allowed(testMethodIds[2], testToken, accounts[1], { from: owner });
            assert.equal(result, false);
        });

        // remove role
        it("Should fail remove role from the wallet for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromSpecificToken(accounts[1], testToken, notExistingRole, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> The wallet has no this role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail remove role from the wallet for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromSpecificToken(accounts[1], testToken, "", { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid role.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail remove role from the wallet for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.removeRoleFromSpecificToken(accounts[1], testToken, systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role management not allowed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should remove role from the wallet for a specific token", async() => {
            let tx = await permissionModule.removeRoleFromSpecificToken(accounts[0], testToken, systemRoleName, { from: owner });
            status = await PMStorage.getTokenDependentRoleStatus(accounts[0], testToken, systemRoleName);
            assert.equal(status, false);
        });

        // verify permission
        it("Should decline access to the method for a specific token after role removing", async() => {
            let result = await permissionModule.allowed(testMethodIds[0], accounts[1], testToken, { from: owner });
            assert.equal(result, false);
        });

        // roles limit
        it("Should fail when wallet roles limit for specific token will be reached", async() => {
            let tx;

            // add roles to the account
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleForSpecificToken(accounts[5], testToken, testRoles[i], { from: owner });
                status = await PMStorage.getTokenDependentRoleStatus(accounts[5], testToken, testRoles[i]);
                assert.equal(status, true);
            }
            
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[5], testToken, testRoles[21], { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> The limit for number of roles has been reached.`.grey);
                assert(isException(error), error.toString());
            }

            assert.ok(errorThrown, "Transaction should fail!");
        });
    });
});