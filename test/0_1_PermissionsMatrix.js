var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SLS20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/SLS20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/SLS20Token.sol");

var TM = artifacts.require("./request-verification-layer/transfer-module/TransferModule.sol");

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
        permissionModule = await PM.new();

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module contract was not deployed"
        );

        let ownerRoleName = "Owner";
        let systemRoleName = "System";
        let registrationRoleName = "Registration";
        let issuerRoleName = "Issuer";

        let tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});

        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});

        assert.equal(registrationRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(issuerRoleName, systemRoleName, {from: accounts[0]});

        assert.equal(issuerRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.parent));

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, regSymbolId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, createTokenId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addStrategyId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, setTM);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);

        symbolRegistry = await SR.new(permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        TokensFactory = await TF.new(symbolRegistry.address.valueOf(), permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TokensFactory contract was not deployed"
        );

        SLS20Strategy = await SLS20S.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SLS20Strategy contract was not deployed"
        ); 
        
        let transferModule = await TM.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: accounts[0] });
        assert.notEqual(
            transferModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TransferModule contract was not deployed"
        );

        await SLS20Strategy.setTransferModule(transferModule.address.valueOf());
        await symbolRegistry.setTokensFactory(TokensFactory.address.valueOf());

        tx = await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : accounts[0] });
        assert.equal(tx.logs[0].args.strategy, SLS20Strategy.address);

        let standard = await SLS20Strategy.getTokenStandard();

        let symbol = "TEST";
        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : accounts[0] });
            
        tx = await TokensFactory.createToken("TEST NAME", symbol, 18, 100000000, standard, { from : accounts[0] });
        testToken = tx.logs[0].args.tokenAddress;

        assert.notEqual(
            testToken,
            "0x0000000000000000000000000000000000000000",
            "New token was not deployed"
        );

        await permissionModule.setTokensFactory(TokensFactory.address.valueOf());

        tx = await permissionModule.removeMethodFromTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);
        assert.equal(tx.logs[0].args.methodId, regSymbolId);

        tx = await permissionModule.removeMethodFromTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);
        assert.equal(tx.logs[0].args.methodId, createTokenId);

        tx = await permissionModule.removeMethodFromTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
        assert.equal(tx.logs[0].args.methodId, addStrategyId);

        tx = await permissionModule.removeMethodFromTheRole(setTM, systemRoleName, { from: accounts[0] });

        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
        assert.equal(tx.logs[0].args.methodId, setTM);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        tx = await permissionModule.removeRoleFromTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
    });
    
    describe("Create roles", async() => {
        it("Should create system role", async() => {
            // init system role
            let tx = await permissionModule.createRole(systemRole, ownerRoleName, {from: owner});

            assert.equal(systemRole, bytes32ToString(tx.logs[0].args.name));
            assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));
        });//

        it("Should create registration role", async() => {
            let tx = await permissionModule.createRole(registrationRole, systemRole, {from: owner});

            assert.equal(registrationRole, bytes32ToString(tx.logs[0].args.name))
            assert.equal(systemRole, bytes32ToString(tx.logs[0].args.parent));
        });

        it("Should create issuer role", async() => {
            // init issuer role
            let tx = await permissionModule.createRole(issuerRole, systemRole, {from: owner});

            assert.equal(issuerRole, bytes32ToString(tx.logs[0].args.name))
            assert.equal(systemRole, bytes32ToString(tx.logs[0].args.parent));
        });

        it("Should create compliance role", async() => {
            // init compliance role
            let tx = await permissionModule.createRole(complianceRole, issuerRole, {from: owner});

            assert.equal(complianceRole, bytes32ToString(tx.logs[0].args.name))
            assert.equal(issuerRole, bytes32ToString(tx.logs[0].args.parent));
        });

        it("Should create whitelist role", async() => {
            // init whitelist role
            let tx = await permissionModule.createRole(whitelistRole, issuerRole, {from: owner});

            assert.equal(whitelistRole, bytes32ToString(tx.logs[0].args.name))
            assert.equal(issuerRole, bytes32ToString(tx.logs[0].args.parent));

        });

        it("Should create rollback role", async() => {
            // init rollback role
            let tx = await permissionModule.createRole(rollbackRole, issuerRole, {from: owner});

            assert.equal(rollbackRole, bytes32ToString(tx.logs[0].args.name))
            assert.equal(issuerRole, bytes32ToString(tx.logs[0].args.parent));
        });
    });

    describe("Add methods to the roles", async() => {
        it("Should add methods to the system role", async() => {
            // system methods
            let tx = await permissionModule.addMethodToTheRole(systemMethods[0], systemRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, systemMethods[0]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRole);

            tx = await permissionModule.addMethodToTheRole(systemMethods[1], systemRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, systemMethods[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRole);
        });

        it("Should add methods to the registration role", async() => {
            // registration methods
            let tx = await permissionModule.addMethodToTheRole(registrationMethods[0], registrationRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, registrationMethods[0]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRole);
        });

        it("Should add methods to the issuer role", async() => {
            // issuer methods
            let tx = await permissionModule.addMethodToTheRole(issuerMethods[0], issuerRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, issuerMethods[0]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRole);

            tx = await permissionModule.addMethodToTheRole(issuerMethods[1], issuerRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, issuerMethods[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRole);
        });

        it("Should add methods to the compliance role", async() => {
            // compliance methods
            let tx = await permissionModule.addMethodToTheRole(complianceMethods[0], complianceRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, complianceMethods[0]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRole);

            tx = await permissionModule.addMethodToTheRole(complianceMethods[1], complianceRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, complianceMethods[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRole);
        });

        it("Should add methods to the whitelist role", async() => {
            // whitelist methods
            let tx = await permissionModule.addMethodToTheRole(whitelistMethod, whitelistRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, whitelistMethod);
            assert.equal(bytes32ToString(tx.logs[0].args.role), whitelistRole);
        });

        it("Should add methods to the rollback role", async() => {
            // rollback methods
            let tx = await permissionModule.addMethodToTheRole(rollbackMethod, rollbackRole, { from: owner });

            assert.equal(tx.logs[0].args.methodId, rollbackMethod);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rollbackRole);
        });
    });
    
    describe("Add roles to the wallets", async() => {
        it("Should add wallets to the system role", async() => {
            let tx = await permissionModule.addRoleToTheWallet(systemAcc1, systemRole, { from: owner });
                
            assert.equal(tx.logs[0].args.wallet, systemAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRole);

            tx = await permissionModule.addRoleToTheWallet(systemAcc2, systemRole, { from: owner });
                
            assert.equal(tx.logs[0].args.wallet, systemAcc2);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRole);
        });

        it("Should add wallet to the registration role", async() => {
            let tx = await permissionModule.addRoleToTheWallet(registrationAcc1, registrationRole, { from: systemAcc1 });
                
            assert.equal(tx.logs[0].args.wallet, registrationAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRole);
        });

        it("Should add wallet to the issuer role", async() => {
            let tx = await permissionModule.addRoleToTheWallet(issuerAcc1, issuerRole, { from: systemAcc2 });
                
            assert.equal(tx.logs[0].args.wallet, issuerAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRole);
        });
    });
    // token dependent
    describe("Add roles to the wallets for a specific token", async() => {
        it("Should add wallet to the compliance role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(complianceAcc1, testToken, complianceRole, { from: issuerAcc1 });
                
            assert.equal(tx.logs[0].args.wallet, complianceAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRole);
        });

        it("Should add wallet to the whitelist role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(whitelistAcc1, testToken, whitelistRole, { from: issuerAcc1 });
                
            assert.equal(tx.logs[0].args.wallet, whitelistAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), whitelistRole);

            tx = await permissionModule.addRoleForSpecificToken(whitelistAcc2, testToken, whitelistRole, { from: issuerAcc1 });
                
            assert.equal(tx.logs[0].args.wallet, whitelistAcc2);
            assert.equal(bytes32ToString(tx.logs[0].args.role), whitelistRole);

        });

        it("Should add wallet to the rollback role", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(rollbackAcc1, testToken, rollbackRole, { from: issuerAcc1 });
                
            assert.equal(tx.logs[0].args.wallet, rollbackAcc1);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rollbackRole);
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