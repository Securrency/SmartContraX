var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SRStorage = artifacts.require("./registry-layer/symbol-registry/eternal-storage/SRStorage.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var TFStorage = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var ERC20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/ERC20Strategy.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var TCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var CAT20Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT20Verification.sol");
var CAT721Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT721Verification.sol");

var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMStorage = artifacts.require("./request-verification-layer/permission-module/eternal-storages/PMStorage.sol");

var AppRegistry = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var AppRegistryStorage = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");

function createId(signature) {
  let hash = web3.sha3(signature);

  return hash.substring(0, 10);
}

module.exports = function(deployer, network, accounts) {
  var tokensFactoryDeployed;
  var CAT20StrategyDeployed;
  var CAT721StrategyDeployed;
  var ERC20StrategyDeployed;
  var SymbolRegistryDeployed;
  var TransferModuleDeployed;
  var WhiteListDeployed;
  var CAT20VerificationDeployed;
  var CAT721VerificationDeployed;
  var PermissionModuleDeployed;
  var ComponentsRegistryDeployed;
  var AppRegDeployed;
  var AppRegStorageDeployed;
  var SRStorageDeployed;
  var TFStorageDeployed;
  var PMStorageDeployed;
  var TCStorageDeployed;
  var FCStorageDeployed;
  
  deployer.deploy(ComponentsRegistry, {gas: 6400000})
  .then((instance) => {
    ComponentsRegistryDeployed = instance;
    return deployer.deploy(PMStorage, ComponentsRegistryDeployed.address, {gas: 3800000})
    .then((instance) => {
      PMStorageDeployed = instance;
      return deployer.deploy(PermissionModule, ComponentsRegistryDeployed.address, PMStorageDeployed.address, {gas: 6200000})
    })
    .then((instance) => {
      PermissionModuleDeployed = instance;
      return deployer.deploy(SRStorage, ComponentsRegistryDeployed.address, {gas: 3100000})
    })
    .then((instance) => {
      SRStorageDeployed = instance;
      return deployer.deploy(SymbolRegistry, ComponentsRegistryDeployed.address, SRStorageDeployed.address, {gas: 3500000})
    })
    .then((instance) => {
      SymbolRegistryDeployed = instance;
      return deployer.deploy(TFStorage, ComponentsRegistryDeployed.address, {gas: 4100000})
    })
    .then((instance) => {
      TFStorageDeployed = instance;
      return deployer.deploy(TokensFactory, ComponentsRegistryDeployed.address, TFStorageDeployed.address, {gas: 4100000})
    })
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(WhiteList, ComponentsRegistryDeployed.address, {gas: 1200000});
    })
    .then((instance) => {
      WhiteListDeployed = instance;
      return deployer.deploy(CAT20Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT20VerificationDeployed = instance;
      return deployer.deploy(TCStorage, ComponentsRegistryDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      TCStorageDeployed = instance;
      return deployer.deploy(FCStorage, ComponentsRegistryDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      FCStorageDeployed = instance;
      return deployer.deploy(TransferModule, ComponentsRegistryDeployed.address, TCStorageDeployed.address, FCStorageDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(CAT20Strategy, ComponentsRegistryDeployed.address, {gas: 6600000}); 
    })
    .then((instance) => {
      CAT20StrategyDeployed = instance;
      return deployer.deploy(ERC20Strategy, ComponentsRegistryDeployed.address, {gas: 3700000});
    })
    .then((instance) => {
      ERC20StrategyDeployed = instance;
      return deployer.deploy(CAT721Strategy, ComponentsRegistryDeployed.address, {gas: 5700000});
    })
    .then((instance) => {
      CAT721StrategyDeployed = instance;
      return deployer.deploy(CAT721Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT721VerificationDeployed = instance;
      return deployer.deploy(AppRegistryStorage, ComponentsRegistryDeployed.address, {gas: 4100000});
    })
    .then((instance) => {
      AppRegStorageDeployed = instance;
      return deployer.deploy(AppRegistry, ComponentsRegistryDeployed.address, AppRegStorageDeployed.address, {gas: 6400000});
    })
    .then((instance) => {
      AppRegDeployed = instance;
    })
    .then(() => {
      return ComponentsRegistryDeployed.initializePermissionModule(PermissionModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return PermissionModuleDeployed.createRole("System", "Owner", {gas: 300000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addTokenStrategy(address)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addVerificationLogic(address,bytes32)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("setTransferModule(address)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addNewChain(bytes32)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("removeChain(bytes32)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("registerNewComponent(address)"), "System", {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addRoleToTheWallet(accounts[0], "System", {gas:300000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(tokensFactoryDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(SymbolRegistryDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(AppRegDeployed.address, {gas: 120000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT20StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(ERC20StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT721StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return CAT20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return CAT721StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT721VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x476f436861696e", {gas: 180000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x457468657265756d", {gas: 180000});
    });
  });
};
