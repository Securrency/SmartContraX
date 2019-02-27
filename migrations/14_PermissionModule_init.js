var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

module.exports = async function(deployer, network, accounts) {
    var PermissionModuleDeployed;
    var ComponentsRegistryDeployed;

    var systemRole = web3.utils.toHex("System");
    var ownerRole = web3.utils.toHex("Owner");

    var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
    var PermissionModuleDeployed = await PermissionModule.deployed();

    await ComponentsRegistryDeployed.initializePermissionModule(PermissionModuleDeployed.address, {gas: 120000});
    await PermissionModuleDeployed.createRole(systemRole, ownerRole, {gas: 300000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("addTokenStrategy(address)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("addVerificationLogic(address,bytes32)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("addNewChain(bytes32)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("removeChain(bytes32)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("registerNewComponent(address)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addMethodToTheRole(createId("setActionExecutor(bytes32,address)"), systemRole, {gas: 500000});
    await PermissionModuleDeployed.addRoleToTheWallet(accounts[0], systemRole, {gas:300000});
};