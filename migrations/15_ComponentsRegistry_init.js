var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var AppRegistry = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");

module.exports = async function(deployer, network, accounts) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
  var TransferModuleDeployed = await TransferModule.deployed();
  var TokensFactoryDeployed = await TokensFactory.deployed();
  var SymbolRegistryDeployed = await SymbolRegistry.deployed();
  var AppRegDeployed = await AppRegistry.deployed();

  await ComponentsRegistryDeployed.registerNewComponent(TransferModuleDeployed.address, {gas: 120000});
  await ComponentsRegistryDeployed.registerNewComponent(TokensFactoryDeployed.address, {gas: 120000});
  await ComponentsRegistryDeployed.registerNewComponent(SymbolRegistryDeployed.address, {gas: 120000});
  await ComponentsRegistryDeployed.registerNewComponent(AppRegDeployed.address, {gas: 120000});
};