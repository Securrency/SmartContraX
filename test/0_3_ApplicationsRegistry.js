var AR = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var ARS = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

contract("Applications registry", accounts => {
    let permissionModule;
    let componentsRegistry;
    let applicationsRegistry;
    let ARStorage;
    let PMETokenStorage;

    let ownerRoleName = web3.utils.toHex("Owner");
    let systemRoleName = web3.utils.toHex("System");

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components registry contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        PMETokenStorage = await PMEST.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), PMETokenStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module contract was not deployed"
        );

        await componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

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

        tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, regCompId);
        assert.equal(status, true);

        let createCATA = createId("createCATApp(address)");
        tx = await permissionModule.addMethodToTheRole(createCATA, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, createCATA);
        assert.equal(status, true);

        let removeCATA = createId("removeCATApp(address)");
        tx = await permissionModule.addMethodToTheRole(removeCATA, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, removeCATA);
        assert.equal(status, true);
            
        let changeCATA = createId("changeCATAppStatus(address,bool)");
        tx = await permissionModule.addMethodToTheRole(changeCATA, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, changeCATA);
        assert.equal(status, true);

        tx = await componentsRegistry.registerNewComponent(applicationsRegistry.address.valueOf(), { from: accounts[0] });
        assert.equal(tx.logs[0].args.componentAddress, applicationsRegistry.address.valueOf());
    });

    describe("Test CAT applications registry", async() => {
        it("Should create application", async() => {
            let tx = await applicationsRegistry.createCATApp(accounts[9], { from: accounts[0] });
            let topic = "0x8497d72ea0779ab7050fb26725eeeb177632d04eeab50ee68d471da302313169";
            assert.equal(tx.receipt.rawLogs[0].topics[0], topic);
        });

        it("Should show that application is active", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], "0x0000000000000000000000000000000000000000", { from: accounts[0] });
            assert.equal(result, true);
        });

        it("Should set an application on pause", async() => {
            let tx = await applicationsRegistry.changeCATAppStatus(accounts[9], false, { from: accounts[0] });
            let topic = "0x0758f995530e15d8f0d1d184e03e566e227f5d1157f6bf09420fdb4ed919b52b";
            assert.equal(tx.receipt.rawLogs[0].topics[0], topic);
        });

        it("Should show that application is not active", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], "0x0000000000000000000000000000000000000000", { from: accounts[0] });
            assert.equal(result, false);
        });

        it("Should move an application from the pause", async() => {
            let tx = await applicationsRegistry.changeCATAppStatus(accounts[9], true, { from: accounts[0] });
            let topic = "0x0758f995530e15d8f0d1d184e03e566e227f5d1157f6bf09420fdb4ed919b52b";
            assert.equal(tx.receipt.rawLogs[0].topics[0], topic);
        });

        it("Should show that application is not registered", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[8], accounts[8], { from: accounts[0] });
            assert.equal(result, false);
        });

        it ("Should returns list of registered applications", async() => {
            let result = await ARStorage.getCATApplications();

            assert.notEqual(result.indexOf(accounts[9]), -1);
            assert.equal(result.indexOf(accounts[8]), -1);
        });

        it ("Should remove application from the CAT registry", async() => {
            let tx = await applicationsRegistry.removeCATApp(accounts[9], { from: accounts[0] });
            let topic = "0xe9acc0144859ac3efbea36e7043b9de2ed34bbcafdcde7dae2657db51fe80687";
            
            assert.equal(topic, tx.receipt.rawLogs[0].topics[0]);
        });

        it("Should show that removed application is not registered", async() => {
            let result = await applicationsRegistry.isRegistredApp(accounts[9], "0x0000000000000000000000000000000000000000", { from: accounts[0] });
            assert.equal(result, false);
        });

        it ("Should return empty list of the registred applications", async() => {
            let result = await ARStorage.getCATApplications();

            assert.equal(result.length, 0);
        });

        it("Should create application one more application", async() => {
            let tx = await applicationsRegistry.createCATApp(accounts[1], { from: accounts[0] });
            let topic = "0x8497d72ea0779ab7050fb26725eeeb177632d04eeab50ee68d471da302313169";
            assert.equal(tx.receipt.rawLogs[0].topics[0], topic);
        });

        it ("Should remove application from the CAT registry", async() => {
            let tx = await applicationsRegistry.removeCATApp(accounts[1], { from: accounts[0] });
            let topic = "0xe9acc0144859ac3efbea36e7043b9de2ed34bbcafdcde7dae2657db51fe80687";
            
            assert.equal(topic, tx.receipt.rawLogs[0].topics[0]);
        });
    });
});