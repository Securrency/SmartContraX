var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT20Token.sol");

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

contract('PermissionModule (Permissions matrix)', accounts => {
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;

    // roles
    let ownerRoleName = "Owner";
    let systemRole = makeRole();
    let registrationRole = makeRole();
    let issuerRole = makeRole();
    let complianceRole = makeRole();
    let whitelistRole = makeRole();
    let rollbackRole = makeRole();

    // roles methods
    let systemMethods = [makeId(), makeId()];
    let registrationMethods = [makeId()];
    let issuerMethods = [makeId(), makeId()];
    let whitelistMethod = makeId();
    let rollbackMethod = makeId();
    let complianceMethods = [whitelistMethod, rollbackMethod];

    // accounts
    let owner = accounts[0];
    let systemAcc1 = accounts[1];
    let systemAcc2 = accounts[2];
    let registrationAcc1 = accounts[3];
    let issuerAcc1 = accounts[0];
    let complianceAcc1 = accounts[5];
    let whitelistAcc1 = accounts[6];
    let whitelistAcc2 = accounts[7];
    let rollbackAcc1 = accounts[8]; 

    let testToken = "0x9d4770de60c5876cb0f3bb360803c35b700c6df4";

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
            "Permission module contract was not deployed"
        );

        let ownerRoleName = "Owner";
        let systemRoleName = "System";
        let registrationRoleName = "Registration";
        let issuerRoleName = "Issuer";

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

        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });

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
        tx = await permissionModule.removeMethodFromTheRole(createTokenId, issuerRoleName, { from: accounts[0] });
        tx = await permissionModule.removeMethodFromTheRole(addStrategyId, systemRoleName, { from: accounts[0] });
        tx = await permissionModule.removeMethodFromTheRole(setTM, systemRoleName, { from: accounts[0] });
        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
    });
    
    describe("Create roles", async() => {
        it("Should create system role", async() => {
            // init system role
            let tx = await permissionModule.createRole(systemRole, ownerRoleName, {from: owner});

            status = await PMStorage.getRoleStatus(systemRole);
            assert.equal(status, true);
        });//

        it("Should create registration role", async() => {
            let tx = await permissionModule.createRole(registrationRole, systemRole, {from: owner});

            status = await PMStorage.getRoleStatus(registrationRole);
            assert.equal(status, true);
        });

        it("Should create issuer role", async() => {
            // init issuer role
            let tx = await permissionModule.createRole(issuerRole, systemRole, {from: owner});

            status = await PMStorage.getRoleStatus(issuerRole);
            assert.equal(status, true);
        });

        it("Should create compliance role", async() => {
            // init compliance role
            let tx = await permissionModule.createRole(complianceRole, issuerRole, {from: owner});

            status = await PMStorage.getRoleStatus(complianceRole);
            assert.equal(status, true);
        });

        it("Should create whitelist role", async() => {
            // init whitelist role
            let tx = await permissionModule.createRole(whitelistRole, issuerRole, {from: owner});

            status = await PMStorage.getRoleStatus(whitelistRole);
            assert.equal(status, true);
        });

        it("Should create rollback role", async() => {
            // init rollback role
            let tx = await permissionModule.createRole(rollbackRole, issuerRole, {from: owner});

            status = await PMStorage.getRoleStatus(rollbackRole);
            assert.equal(status, true);
        });
    });

    describe("Add methods to the roles", async() => {
        it("Should add methods to the system role", async() => {
            // system methods
            let tx = await permissionModule.addMethodToTheRole(systemMethods[0], systemRole, { from: owner });

            status = await PMStorage.getMethodStatus(systemRole, systemMethods[0]);
            assert.equal(status, true);

            tx = await permissionModule.addMethodToTheRole(systemMethods[1], systemRole, { from: owner });

            status = await PMStorage.getMethodStatus(systemRole, systemMethods[1]);
            assert.equal(status, true);
        });

        it("Should add methods to the registration role", async() => {
            // registration methods
            let tx = await permissionModule.addMethodToTheRole(registrationMethods[0], registrationRole, { from: owner });

            status = await PMStorage.getMethodStatus(registrationRole, registrationMethods[0]);
            assert.equal(status, true);
        });

        it("Should add methods to the issuer role", async() => {
            // issuer methods
            let tx = await permissionModule.addMethodToTheRole(issuerMethods[0], issuerRole, { from: owner });

            status = await PMStorage.getMethodStatus(issuerRole, issuerMethods[0]);
            assert.equal(status, true);

            tx = await permissionModule.addMethodToTheRole(issuerMethods[1], issuerRole, { from: owner });

            status = await PMStorage.getMethodStatus(issuerRole, issuerMethods[0]);
            assert.equal(status, true);
        });

        it("Should add methods to the compliance role", async() => {
            // compliance methods
            let tx = await permissionModule.addMethodToTheRole(complianceMethods[0], complianceRole, { from: owner });

            status = await PMStorage.getMethodStatus(complianceRole, complianceMethods[0]);
            assert.equal(status, true);

            tx = await permissionModule.addMethodToTheRole(complianceMethods[1], complianceRole, { from: owner });

            status = await PMStorage.getMethodStatus(complianceRole, complianceMethods[1]);
            assert.equal(status, true);
        });

        it("Should add methods to the whitelist role", async() => {
            // whitelist methods
            let tx = await permissionModule.addMethodToTheRole(whitelistMethod, whitelistRole, { from: owner });

            status = await PMStorage.getMethodStatus(whitelistRole, whitelistMethod);
            assert.equal(status, true);
        });

        it("Should add methods to the rollback role", async() => {
            // rollback methods
            let tx = await permissionModule.addMethodToTheRole(rollbackMethod, rollbackRole, { from: owner });

            status = await PMStorage.getMethodStatus(rollbackRole, rollbackMethod);
            assert.equal(status, true);
        });
    });
    
    describe("Add roles to the wallets", async() => {
        it("Should add wallets to the system role", async() => {
            let tx = await permissionModule.addRoleToTheWallet(systemAcc1, systemRole, { from: owner });
                
            status = await PMStorage.verifyRole(systemAcc1, systemRole);
            assert.equal(status, true);

            tx = await permissionModule.addRoleToTheWallet(systemAcc2, systemRole, { from: owner });
                
            status = await PMStorage.verifyRole(systemAcc2, systemRole);
            assert.equal(status, true);
        });

        it("Should add wallet to the registration role", async() => {
            // let length = await PMStorage.getRolesLength();
            // length = parseInt(length);

            // let role;
            // let roles = [];
            // for (let i = 0; i < length; i++) {
            //     role = await PMStorage.getRoleByTheIndex(i);
            //     roles.push(bytes32ToString(role));
            // }

            // console.log(roles, "Roles: ", registrationAcc1, registrationRole);

            let tx = await permissionModule.addRoleToTheWallet(registrationAcc1, registrationRole, { from: owner });
                
            status = await PMStorage.verifyRole(registrationAcc1, registrationRole);
            assert.equal(status, true);
        });

        it("Should add wallet to the issuer role", async() => {
            let tx = await permissionModule.addRoleToTheWallet(issuerAcc1, issuerRole, { from: owner });
                
            status = await PMStorage.verifyRole(issuerAcc1, issuerRole);
            assert.equal(status, true);
        });
    });
    // token dependent
    describe("Add roles to the wallets for a specific token", async() => {
        it("Should add wallet to the compliance role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(complianceAcc1, testToken, complianceRole, { from: issuerAcc1 });
                
            status = await PMStorage.getTokenDependentRoleStatus(complianceAcc1, testToken, complianceRole);
            assert.equal(status, true);
        });

        it("Should add wallet to the whitelist role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(whitelistAcc1, testToken, whitelistRole, { from: issuerAcc1 });
                
            status = await PMStorage.getTokenDependentRoleStatus(whitelistAcc1, testToken, whitelistRole);
            assert.equal(status, true);

            tx = await permissionModule.addRoleForSpecificToken(whitelistAcc2, testToken, whitelistRole, { from: issuerAcc1 });
                
            status = await PMStorage.getTokenDependentRoleStatus(whitelistAcc2, testToken, whitelistRole);
            assert.equal(status, true);

        });

        it("Should add wallet to the rollback role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(rollbackAcc1, testToken, rollbackRole, { from: issuerAcc1 });
                
            status = await PMStorage.getTokenDependentRoleStatus(rollbackAcc1, testToken, rollbackRole);
            assert.equal(status, true);
        });
    });

    describe("Test permissions matrix", async() => {
        // system methods
        it("Should allow access to the system method from the system accounts", async() => {
            let result = await permissionModule.allowedForWallet(systemMethods[0], systemAcc1, { from: systemAcc1 });
            assert.equal(result, true);

            result = await permissionModule.allowedForWallet(systemMethods[0], systemAcc2, { from: systemAcc2 });
            assert.equal(result, true);

            result = await permissionModule.allowedForWallet(systemMethods[1], systemAcc1, { from: systemAcc1 });
            assert.equal(result, true);

            result = await permissionModule.allowedForWallet(systemMethods[1], systemAcc2, { from: systemAcc2 });
            assert.equal(result, true);
        });
        it("Should decline access to the system method from the registration role account", async() => {
            let result = await permissionModule.allowedForWallet(systemMethods[0], registrationAcc1, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the system method from the other account", async() => {
            let result = await permissionModule.allowedForWallet(systemMethods[0], accounts[9], { from: accounts[9] });
            assert.equal(result, false);
        });
        // registration methods
        it("Should allow access to the registration method from the registration accounts", async() => {
            let result = await permissionModule.allowedForWallet(registrationMethods[0], registrationAcc1, { from: registrationAcc1 });
            assert.equal(result, true);
        });
        it("Should decline access to the registration method from the system role account", async() => {
            let result = await permissionModule.allowedForWallet(registrationMethods[0], systemAcc1, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the registration method from the other account", async() => {
            let result = await permissionModule.allowedForWallet(registrationMethods[0], accounts[9], { from: accounts[9] });
            assert.equal(result, false);
        });
        // issuer methods
        it("Should allow access to the issuer method from the issuer account", async() => {
            let result = await permissionModule.allowedForWallet(issuerMethods[0], issuerAcc1, { from: issuerAcc1 });
            assert.equal(result, true);
        });
        it("Should decline access to the issuer method from the system role account", async() => {
            let result = await permissionModule.allowedForWallet(issuerMethods[0], systemAcc1, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the issuer method from the other account", async() => {
            let result = await permissionModule.allowedForWallet(issuerMethods[0], accounts[9], { from: accounts[9] });
            assert.equal(result, false);
        });
    });
    // token dependent
    describe("Test permissions matrix for the token dependent permissions", async() => {
        // compliance methods
        it("Should allow access to the compliance methods from the compliance accounts", async() => {
            let result = await permissionModule.allowed(complianceMethods[0], complianceAcc1, testToken, { from: complianceAcc1 });
            assert.equal(result, true);

            result = await permissionModule.allowed(complianceMethods[1], complianceAcc1, testToken, { from: complianceAcc1 });
            assert.equal(result, true);
        });
        it("Should decline access to the compliance method from the system role account", async() => {
            let result = await permissionModule.allowed(complianceMethods[0], systemAcc1, testToken, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the compliance method from the other account", async() => {
            let result = await permissionModule.allowed(complianceMethods[0], accounts[9], testToken, { from: accounts[9] });
            assert.equal(result, false);
        });
        // whitelist methods
        it("Should allow access to the whitelist method from the compliance account", async() => {
            let result = await permissionModule.allowed(whitelistMethod, complianceAcc1, testToken, { from: complianceAcc1 });
            assert.equal(result, true);
        });
        it("Should allow access to the whitelist method from the whitelist accounts", async() => {
            let result = await permissionModule.allowed(whitelistMethod, whitelistAcc1, testToken, { from: whitelistAcc1 });
            assert.equal(result, true);

            result = await permissionModule.allowed(whitelistMethod, whitelistAcc2, testToken, { from: whitelistAcc2 });
            assert.equal(result, true);
        });
        it("Should decline access to the whitelist method from the system role account", async() => {
            let result = await permissionModule.allowed(whitelistMethod, systemAcc1, testToken, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the whitelist method from the other account", async() => {
            let result = await permissionModule.allowed(whitelistMethod, accounts[9], testToken, { from: accounts[9] });
            assert.equal(result, false);
        });
        // rollback methods
        it("Should allow access to the rollback method from the compliance account", async() => {
            let result = await permissionModule.allowed(rollbackMethod, complianceAcc1, testToken, { from: complianceAcc1 });
            assert.equal(result, true);
        });
        it("Should allow access to the rollback method from the rollback accounts", async() => {
            let result = await permissionModule.allowed(rollbackMethod, rollbackAcc1, testToken, { from: whitelistAcc1 });
            assert.equal(result, true);
        });
        it("Should decline access to the rollback method from the system role account", async() => {
            let result = await permissionModule.allowed(rollbackMethod, systemAcc1, testToken, { from: registrationAcc1 });
            assert.equal(result, false);
        });
        it("Should decline access to the rollback method from the other account", async() => {
            let result = await permissionModule.allowed(rollbackMethod, accounts[9], testToken, { from: accounts[9] });
            assert.equal(result, false);
        });
    });
});