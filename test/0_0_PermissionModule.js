var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function bytes32ToString(bytes32) {
    return web3.toAscii(bytes32).replace(/\0/g, '')
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

        permissionModule = await PM.new();

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module contract was not deployed"
        );
    });

    describe("Test permission module adding and removals mechanism", async() => {
        it("Should create owner role on the deploy", async() => {
            let roles = await permissionModule.getListOfAllRoles();
            assert.equal(ownerRoleName, bytes32ToString(roles[0]));
        });

        it("Should create list of the roles", async() => {
            let tx;
            for (let i = 0; i < testRoles.length; i++) {
                tx = await permissionModule.createRole(testRoles[i], ownerRoleName, {from: owner});

                assert.equal(testRoles[i], bytes32ToString(tx.logs[0].args.name))
                assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));
            }
        });

        it("Should add methods to the role", async() => {
            let tx;
            for (let i = 0; i < testMethodIds.length; i++) {
                tx = await permissionModule.addMethodToTheRole(testMethodIds[i], testRoles[0], { from: owner });

                assert.equal(tx.logs[0].args.methodId, testMethodIds[i]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[0]);
            }
        });

        it("Should correctly remove methods from the role", async() => {
            let methodsToRemove = testMethodIds.slice(0);
            
            let indexToRemove = Math.round(methodsToRemove.length / 2);

            let tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[indexToRemove], testRoles[0], { from: owner });

            assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[0]);
            assert.equal(tx.logs[0].args.methodId, methodsToRemove[indexToRemove]);
            
            methodsToRemove[indexToRemove] = methodsToRemove[methodsToRemove.length - 1];
            methodsToRemove.splice(methodsToRemove.length - 1, 1);

            tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[indexToRemove], testRoles[0], { from: owner });

            assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[0]);
            assert.equal(tx.logs[0].args.methodId, methodsToRemove[indexToRemove]);

            methodsToRemove[indexToRemove] = methodsToRemove[methodsToRemove.length - 1];
            methodsToRemove.splice(methodsToRemove.length - 1, 1);

            for (let i = 0; i < methodsToRemove.length; i++) {
                tx = await permissionModule.removeMethodFromTheRole(methodsToRemove[i], testRoles[0], { from: owner });

                assert.equal(tx.logs[0].args.methodId, methodsToRemove[i]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[0]);
            }

            let roleMethods = await permissionModule.getSupportedMethodsByRole(testRoles[0]);
            
            assert.equal(roleMethods.length, 0)
        });

        it("Should add roles to the wallet", async() => {
            let tx;
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleToTheWallet(accounts[9], testRoles[i], { from: owner });
                
                assert.equal(tx.logs[0].args.wallet, accounts[9]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[i]);
            }
        });

        it("Should correctly remove roles from the wallet", async() => {
            let rolesToRemove = testRoles.slice(0);
            rolesToRemove.splice(20, 5);
            
            let indexToRemove = Math.round(rolesToRemove.length / 2);

            let tx = await permissionModule.removeRoleFromTheWallet(accounts[9], rolesToRemove[indexToRemove], { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[9]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[indexToRemove]);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);

            tx = await permissionModule.removeRoleFromTheWallet(accounts[9], rolesToRemove[indexToRemove], { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[9]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[indexToRemove]);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);
            
            for (let i = 0; i < 18; i++) {
                tx = await permissionModule.removeRoleFromTheWallet(accounts[9], rolesToRemove[i], { from: owner });
                
                assert.equal(tx.logs[0].args.wallet, accounts[9]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[i]);
            }

            let walletRoles = await permissionModule.getWalletRoles(accounts[9]);
            
            for (i = 0; i < walletRoles.length; i++) {
                assert.equal(walletRoles[i], "0x0000000000000000000000000000000000000000000000000000000000000000");
            }
        });

        it("Should add roles for specific token", async() => {
            let tx;
            for (let i = 0; i < 20; i++) {
                tx = await permissionModule.addRoleForSpecificToken(accounts[9], testToken, testRoles[i], { from: owner });
                
                assert.equal(tx.logs[0].args.wallet, accounts[9]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[i]);
            }
        });

        it("Should correctly remove roles from the specific token", async() => {
            let rolesToRemove = testRoles.slice(0);
            rolesToRemove.splice(20, 5);
            
            let indexToRemove = Math.round(rolesToRemove.length / 2);

            let tx = await permissionModule.removeRoleFromSpecificToken(accounts[9], testToken, rolesToRemove[indexToRemove], { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[9]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[indexToRemove]);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);

            tx = await permissionModule.removeRoleFromSpecificToken(accounts[9], testToken, rolesToRemove[indexToRemove], { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[9]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[indexToRemove]);

            rolesToRemove[indexToRemove] = rolesToRemove[rolesToRemove.length - 1];
            rolesToRemove.splice(rolesToRemove.length - 1, 1);
            
            for (let i = 0; i < 18; i++) {
                tx = await permissionModule.removeRoleFromSpecificToken(accounts[9], testToken, rolesToRemove[i], { from: owner });
                
                assert.equal(tx.logs[0].args.wallet, accounts[9]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), rolesToRemove[i]);
            }

            let walletRoles = await permissionModule.getWalletRolesForToken(accounts[9], testToken);
            
            for (i = 0; i < walletRoles.length; i++) {
                assert.equal(walletRoles[i], "0x0000000000000000000000000000000000000000000000000000000000000000");
            }
        });
    });

    describe("Test roles manager", async() => {
        it("Should create a new role", async() => {
            let tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: owner});

            assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.name))
            assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));
        });

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

            assert.equal(tx.logs[0].args.methodId, testMethodIds[0]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
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

            assert.equal(tx.logs[0].args.methodId, testMethodIds[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
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
            let methods = await permissionModule.getSupportedMethodsByRole(systemRoleName);

            assert.equal(methods.indexOf(testMethodIds[1]), 1);

            let tx =await permissionModule.removeMethodFromTheRole(testMethodIds[1], systemRoleName, { from: owner });

            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
            assert.equal(tx.logs[0].args.methodId, testMethodIds[1]);

            methods = await permissionModule.getSupportedMethodsByRole(systemRoleName);

            assert.equal(methods.indexOf(testMethodIds[1]), -1);
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
            let tx = await permissionModule.deactivateRole(systemRoleName, { from: owner });

            assert.equal(bytes32ToString(tx.logs[0].args.name), systemRoleName);
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
            let tx = await permissionModule.activateRole(systemRoleName, { from: owner });

            assert.equal(bytes32ToString(tx.logs[0].args.name), systemRoleName);
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
            
            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
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
            
                assert.equal(tx.logs[0].args.wallet, accounts[4]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[i]);
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
            
            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
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

            assert.equal(tx.logs[2].args.oldOwner, owner);
            assert.equal(tx.logs[2].args.newOwner, accounts[1]);
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

            assert.equal(tx.logs[0].args.wallet, accounts[3]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
        });

        it("Should transfer ownership back to the previous owner", async() => {
            let tx = await permissionModule.transferOwnership(owner, { from: accounts[1] });

            assert.equal(tx.logs[2].args.oldOwner, accounts[1]);
            assert.equal(tx.logs[2].args.newOwner, owner);
        });

        it("Should execute ownable method from new onwer account", async() => {
            let tx = await permissionModule.removeRoleFromTheWallet(accounts[3], systemRoleName, { from: owner });

            assert.equal(tx.logs[0].args.wallet, accounts[3]);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
        });
    });

    describe("Test token roles manager", async() => {
        // add role to the wallet
        it("Should fail add role for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[1], testToken, "", { from: owner });
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
                await permissionModule.addRoleForSpecificToken(accounts[1], testToken, systemRoleName, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role management not allowed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add role for a specific token", async() => {
            let tx = await permissionModule.addRoleForSpecificToken(accounts[1], testToken, systemRoleName, { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(tx.logs[0].args.token, testToken);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
        });

        it("Should fail add role for a specific token", async() => {
            let errorThrown = false;
            try {
                await permissionModule.addRoleForSpecificToken(accounts[1], testToken, systemRoleName, { from: owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Role already added.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        // verify permission
        it("Should allow access to the method for a specific token", async() => {
            let result = await permissionModule.allowed(testMethodIds[0], accounts[1], testToken, { from: owner });
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
            let tx = await permissionModule.removeRoleFromSpecificToken(accounts[1], testToken, systemRoleName, { from: owner });
            
            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(tx.logs[0].args.token, testToken);
            assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);
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
            
                assert.equal(tx.logs[0].args.wallet, accounts[5]);
                assert.equal(bytes32ToString(tx.logs[0].args.role), testRoles[i]);
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