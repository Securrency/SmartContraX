var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var ERC20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/ERC20Strategy.sol");

var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var CAT20Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT20Verification.sol");
var CAT721Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT721Verification.sol");

var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

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
  
  deployer.deploy(PermissionModule, {gas: 5400000})
  .then((instance) => {
    PermissionModuleDeployed = instance;
    return deployer.deploy(SymbolRegistry, PermissionModuleDeployed.address, {gas: 2800000})
    .then((instance) => {
      SymbolRegistryDeployed = instance;
      return deployer.deploy(TokensFactory, SymbolRegistryDeployed.address, PermissionModuleDeployed.address, {gas: 3100000})
    })
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(WhiteList, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 1000000});
    })
    .then((instance) => {
      WhiteListDeployed = instance;
      return deployer.deploy(CAT20Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT20VerificationDeployed = instance;
      return deployer.deploy(TransferModule, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 5200000});
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(CAT20Strategy, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 3700000}); 
    })
    .then((instance) => {
      CAT20StrategyDeployed = instance;
      return deployer.deploy(ERC20Strategy, tokensFactoryDeployed.address, {gas: 3700000});
    })
    .then((instance) => {
      ERC20StrategyDeployed = instance;
      return deployer.deploy(CAT721Strategy, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 5700000});
    })
    .then((instance) => {
      CAT721StrategyDeployed = instance;
      return deployer.deploy(CAT721Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT721VerificationDeployed = instance;
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
      return PermissionModuleDeployed.addRoleToTheWallet(accounts[0], "System", {gas:300000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT20StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(ERC20StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT721StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return CAT20StrategyDeployed.setTransferModule(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return CAT721StrategyDeployed.setTransferModule(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return PermissionModuleDeployed.setTokensFactory(tokensFactoryDeployed.address, {gas: 500000});
    })
    .then(() => {
      return SymbolRegistryDeployed.setTokensFactory(tokensFactoryDeployed.address, {gas: 500000});
    })
    .then(() => {
      return CAT20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x476f436861696e", {gas: 180000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x457468657265756d", {gas: 180000});
    })
    .then(() => {
      return CAT721StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT721VerificationDeployed.address, standard, {gas: 120000});
    });
  });
};
