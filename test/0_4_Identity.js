var ID = artifacts.require('./registry-layer/identity/Identity.sol');
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");

function createId(signature) {
    return web3.utils.keccak256(signature).substring(0, 10);
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract("Identity", accounts => {
    let identity;
    let PMStorage;
    let permissionModule;
    let componentsRegistry;

    let ownerRoleName = web3.utils.toHex("Owner");
    let systemRoleName = web3.utils.toHex("System");

    let attribute1 = web3.utils.toHex("country");
    let attribute2 = web3.utils.toHex("isVerifiedInvestor");

    let country = web3.utils.toHex("US");
    let isVerifiedInvestor = web3.utils.toHex("false");

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components registry contract was not deployed"
        );

        identity = await ID.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Identity contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

        await componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

        await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        let setAttr = createId("setWalletAttribute(address,bytes32,bytes32)");
        await permissionModule.addMethodToTheRole(setAttr, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, setAttr);
        assert.equal(status, true);

        let deleteAttr = createId("deleteWalletAttribute(address,bytes32)");
        await permissionModule.addMethodToTheRole(deleteAttr, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, deleteAttr);
        assert.equal(status, true);
    });

    describe("Test identity", async() => {
        it("Should set new wallet attribute", async() => {
            let tx = await identity.setWalletAttribute(accounts[1], attribute1, country, { from: accounts[0] });
            
            let attribute = tx.logs[0].args.attribute;
            let j = attribute.length - 1;
            while(attribute[j] == 0) {
                j--;
            }

            attribute = attribute.substring(0, j+1);

            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(attribute, attribute1);
        });

        it("Should returns wallet attribute value", async() => {
            let value = await identity.getWalletAttribute(accounts[1], attribute1);

            let j = value.length - 1;
            while(value[j] == 0) {
                j--;
            }

            value = value.substring(0, j+1);

            assert.equal(country, value);
        });

        it("Should set one more wallet attribute", async() => {
            let tx = await identity.setWalletAttribute(accounts[1], attribute2, isVerifiedInvestor, { from: accounts[0] });
            
            let attribute = tx.logs[0].args.attribute;
            let j = attribute.length - 1;
                while(attribute[j] == 0) {
                    j--;
                }

            attribute = attribute.substring(0, j+1);

            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(attribute, attribute2);
        });

        it("Fails set wallet attribute from the not authorized account", async() => {
            let errorThrown = false;
            try {
                await identity.setWalletAttribute(accounts[2], attribute1, country, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should delete wallet attribute", async() => {
            let tx = await identity.deleteWalletAttribute(accounts[1], attribute1, { from: accounts[0] });
            
            let attribute = tx.logs[0].args.attribute;
            let j = attribute.length - 1;
                while(attribute[j] == 0) {
                    j--;
                }

            attribute = attribute.substring(0, j+1);

            assert.equal(tx.logs[0].args.wallet, accounts[1]);
            assert.equal(attribute, attribute1);
        });

        it("Fails to delete wallet attribute from the not authorized account", async() => {
            let errorThrown = false;
            try {
                await identity.deleteWalletAttribute(accounts[1], attribute2, { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
    });
});