var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SLS20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/SLS20Strategy.sol");
var ERC20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/ERC20Strategy.sol");

var TransferModule = artifacts.require("./request-verification-layer/transfer-module/TransferModule.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-module/transfer-service/WhiteList.sol");
var SLS20Verification = artifacts.require("./request-verification-layer/transfer-module/verification-service/SLS20Verification.sol");

var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
  let hash = web3.sha3(signature);

  return hash.substring(0, 10);
}

module.exports = function(deployer, network, accounts) {
  var tokensFactoryDeployed;
  var SLS20StrategyDeployed;
  var ERC20StrategyDeployed;
  var SymbolRegistryDeployed;
  var TransferModuleDeployed;
  var WhiteListDeployed;
  var SLS20VerificationDeployed;
  var PermissionModuleDeployed;
  
  deployer.deploy(PermissionModule, {gas: 5400000})
  .then((instance) => {
    PermissionModuleDeployed = instance;
    return deployer.deploy(SymbolRegistry, PermissionModuleDeployed.address, {gas: 2500000})
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
      return deployer.deploy(SLS20Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      SLS20VerificationDeployed = instance;
      return deployer.deploy(TransferModule, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 900000});
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(SLS20Strategy, tokensFactoryDeployed.address, PermissionModuleDeployed.address, {gas: 4100000}); 
    })
    .then((instance) => {
      SLS20StrategyDeployed = instance;
      return deployer.deploy(ERC20Strategy, tokensFactoryDeployed.address, {gas: 3700000});
    })
    .then((instance) => {
      ERC20StrategyDeployed = instance;
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
      return PermissionModuleDeployed.addRoleToTheWallet(accounts[0], "System", {gas:300000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(SLS20StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(ERC20StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return SLS20StrategyDeployed.setTransferModule(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return PermissionModuleDeployed.setTokensFactory(tokensFactoryDeployed.address, {gas: 500000});
    })
    .then(() => {
      return SymbolRegistryDeployed.setTokensFactory(tokensFactoryDeployed.address, {gas: 500000});
    })
    .then(() => {
      return SLS20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(SLS20VerificationDeployed.address, standard, {gas: 120000});
    });
  });
};
