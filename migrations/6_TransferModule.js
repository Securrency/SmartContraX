var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var TCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");

module.exports = async function(deployer) {
  ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(TCStorage, ComponentsRegistryDeployed.address, {gas: 600000});
  await deployer.deploy(FCStorage, ComponentsRegistryDeployed.address, {gas: 600000});
  await deployer.deploy(TransferModule, ComponentsRegistryDeployed.address, TCStorage.address, FCStorage.address, {gas: 2500000});
};