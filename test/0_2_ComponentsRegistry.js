let CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
let CM = artifacts.require("./common/mocks/ComponentMock.sol");

contract("Coponents registry", accounts => {
    let componentsRegistry;
    let component1;
    let component2;
    let component3;

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components registry contract was not deployed"
        );

        component1 = await CM.new("ComponentMock1");
        assert.notEqual(
            component1.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
        );

        component2 = await CM.new("ComponentMock2");
        assert.notEqual(
            component2.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
        );

        component3 = await CM.new("ComponentMock2");
        assert.notEqual(
            component3.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Component contract was not deployed"
        );
    });

    describe("Test components registry", async() => {
        it("Should add new component to the registry", async() => {
            let id = await component1.getId();
            let name = await component1.getName();
            let address = component1.address.valueOf();

            let tx = await componentsRegistry.registerNewComponent(address);

            assert.equal(tx.logs[0].args.componentAddress, address);
            assert.equal(tx.logs[0].args.id, id);
            assert.equal(tx.logs[0].args.name, name);
        });

        it("Should return component details", async() => {
            let id = await component1.getId();
            let name = await component1.getName();
            let address = component1.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);
            let componentName = await componentsRegistry.getNameById(id);

            assert.equal(componentAddress, address);
            assert.equal(componentName, name);
        });

        it("Should add one more component", async() => {
            let id = await component2.getId();
            let name = await component2.getName();
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

            let id1 = await component1.getId();
            let id2 = await component2.getId();

            assert.notEqual(componentsList.indexOf(id1), -1);
            assert.notEqual(componentsList.indexOf(id2), -1);
        });

        it("Should delete component", async() => {
            let address = component1.address.valueOf();

            let tx = await componentsRegistry.removeComponent(address);

            assert.equal(tx.logs[0].args.componentAddress, address);
        });

        it("Should fail to return deleted component details", async() => {
            let id = await component1.getId();

            let componentAddress = await componentsRegistry.getAddressById(id);

            assert.equal(componentAddress, "0x0000000000000000000000000000000000000000");
        });

        it("Should return second component details", async() => {
            let id = await component2.getId();
            let address = component2.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);

            assert.equal(componentAddress, address);
        });

        it("Should update component", async() => {
            let oldAddress = component2.address.valueOf();
            let newAddress = component3.address.valueOf();

            let tx = await componentsRegistry.updateComponent(oldAddress, newAddress);

            assert.equal(tx.logs[2].args.oldAddress, oldAddress);
            assert.equal(tx.logs[2].args.newAddress, newAddress);
        });

        it("Should return component details after update", async() => {
            let id = await component2.getId();
            let name = await component2.getName();
            let address = component3.address.valueOf();

            let componentAddress = await componentsRegistry.getAddressById(id);
            let componentName = await componentsRegistry.getNameById(id);

            assert.equal(componentAddress, address);
            assert.equal(componentName, name);
        });
    });
});
