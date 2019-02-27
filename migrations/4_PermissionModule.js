var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMStorage = artifacts.require("./request-verification-layer/permission-module/eternal-storages/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");

module.exports = async function(deployer) {
  ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(PMStorage, ComponentsRegistryDeployed.address, {gas: 3800000});
  await deployer.deploy(PMEST, ComponentsRegistryDeployed.address, PMStorage.address, {gas: 1600000})
  await deployer.deploy(PermissionModule, ComponentsRegistryDeployed.address, PMStorage.address, PMEST.address, {gas: 6600000});
};