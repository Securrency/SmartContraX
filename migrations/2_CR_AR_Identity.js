var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var Identity = artifacts.require("./registry-layer/identity/Identity.sol");
var AppRegistry = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var AppRegistryStorage = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");

module.exports = async function(deployer) {
  await deployer.deploy(ComponentsRegistry, {gas: 6400000});
  await deployer.deploy(Identity, ComponentsRegistry.address, {gas: 3800000});
  await deployer.deploy(AppRegistryStorage, ComponentsRegistry.address, {gas: 4100000});
  await deployer.deploy(AppRegistry, ComponentsRegistry.address, AppRegistryStorage.address, {gas: 6400000});
};