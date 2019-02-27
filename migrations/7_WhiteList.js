var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var WhiteListWithIds = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteListWithIds.sol");

module.exports = async function(deployer) {
  ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(WhiteList, ComponentsRegistryDeployed.address, {gas: 1400000});
  await deployer.deploy(WhiteListWithIds, ComponentsRegistryDeployed.address, {gas: 1400000});
};