let CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
let CM = artifacts.require("./common/mocks/ComponentMock.sol");
var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

contract("Components registry", accounts => {
    let permissionModule;
    let componentsRegistry;
    let component1;
    let component2;
    let component3;
    let PMETokenStorage;
    let PMStorage;

    let ownerRoleName = web3.utils.toHex("Owner");
    let systemRoleName = web3.utils.toHex("System");

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components registry contract was not deployed"
        );

        component1 = await CM.new(web3.utils.toHex("ComponentMock1"));
        assert.notEqual(
            component1.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
        );

        component2 = await CM.new(web3.utils.toHex("ComponentMock2"));
        assert.notEqual(
            component2.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
        );

        component3 = await CM.new(web3.utils.toHex("ComponentMock2"));
        assert.notEqual(
            component3.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
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

        let tx = await componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

        tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, regCompId);
        assert.equal(status, true);

        let updateCompId = createId("updateComponent(address,address)");
        tx = await permissionModule.addMethodToTheRole(updateCompId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, updateCompId);
        assert.equal(status, true);

        let remCompId = createId("removeComponent(address)");
        tx = await permissionModule.addMethodToTheRole(remCompId, systemRoleName, { from: accounts[0] });
        status = await PMStorage.getMethodStatus(systemRoleName, remCompId);
        assert.equal(status, true);
    });

    describe("Test components registry", async() => {
        it("Should add new component to the registry", async() => {
            let id = await component1.getComponentId();
            let name = await component1.getComponentName();
            let address = component1.address.valueOf();

            let tx = await componentsRegistry.registerNewComponent(address);

            assert.equal(tx.logs[0].args.componentAddress, address);
            assert.equal(tx.logs[0].args.id, id);
            assert.equal(tx.logs[0].args.name, name);
        });

        it("Should return component details", async() => {
            let id = await component1.getComponentId();
            let name = await component1.getComponentName();
            let address = component1.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);
            let componentName = await componentsRegistry.getNameById(id);

            assert.equal(componentAddress, address);
            assert.equal(componentName, name);
        });

        it("Should add one more component", async() => {
            let id = await component2.getComponentId();
            let name = await component2.getComponentName();
            let address = component2.address.valueOf();

            let tx = await componentsRegistry.registerNewComponent(address);

            assert.equal(tx.logs[0].args.componentAddress, address);
            assert.equal(tx.logs[0].args.id, id);
            assert.equal(tx.logs[0].args.name, name);
        });

        it("Should get components list", async() => {
            let numberOfComponents = await componentsRegistry.numberOfComponents();
            
            let componentsList = []; 
            for (let i = 0; i < numberOfComponents; i++) {
                let component = await componentsRegistry.componentsList(i);
                componentsList.push(component);
            }

            let id1 = await component1.getComponentId();
            let id2 = await component2.getComponentId();

            assert.notEqual(componentsList.indexOf(id1), -1);
            assert.notEqual(componentsList.indexOf(id2), -1);
        });

        it("Should delete component", async() => {
            let address = component1.address.valueOf();

            let tx = await componentsRegistry.removeComponent(address);

            assert.equal(tx.logs[0].args.componentAddress, address);
        });

        it("Should fail to return deleted component details", async() => {
            let id = await component1.getComponentId();

            let componentAddress = await componentsRegistry.getAddressById(id);

            assert.equal(componentAddress, "0x0000000000000000000000000000000000000000");
        });

        it("Should return second component details", async() => {
            let id = await component2.getComponentId();
            let address = component2.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);

            assert.equal(componentAddress, address);
        });

        it("Should update component", async() => {
            let oldAddress = component2.address.valueOf();
            let newAddress = component3.address.valueOf();

            let tx = await componentsRegistry.updateComponent(oldAddress, newAddress);

            assert.equal(tx.logs[0].args.oldAddress, oldAddress);
            assert.equal(tx.logs[0].args.newAddress, newAddress);
        });

        it("Should return component details after update", async() => {
            let id = await component2.getComponentId();
            let name = await component2.getComponentName();
            let address = component3.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);
            let componentName = await componentsRegistry.getNameById(id);

            assert.equal(componentAddress, address);
            assert.equal(componentName, name);
        });
    });
});
