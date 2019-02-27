var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SRStorage = artifacts.require("./registry-layer/symbol-registry/eternal-storage/SRStorage.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var TFStorage = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

module.exports = async function(deployer) {
  ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(SRStorage, ComponentsRegistryDeployed.address, {gas: 3100000});
  await deployer.deploy(SymbolRegistry, ComponentsRegistryDeployed.address, SRStorage.address, {gas: 3500000});
  await deployer.deploy(TFStorage, ComponentsRegistryDeployed.address, {gas: 1600000});
  await deployer.deploy(TokensFactory, ComponentsRegistryDeployed.address, TFStorage.address, {gas: 2700000});
};