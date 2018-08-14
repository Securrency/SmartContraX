var SymbolRegistry = artifacts.require("./services/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./TokensFactory.sol");
var SLS20Strategy = artifacts.require("./tokens-strategies/SLS20Strategy.sol");
var ERC20Strategy = artifacts.require("./tokens-strategies/ERC20Strategy.sol");

var TransferModule = artifacts.require("./modules/transfer/TransferModule.sol");
var WhiteList = artifacts.require("./modules/transfer/transfer-verification/WhiteList.sol");
var SLS20Verification = artifacts.require("./modules/transfer/verification-service/SLS20Verification.sol");

module.exports = function(deployer) {
  var tokensFactoryDeployed;
  var SLS20StrategyDeployed;
  var ERC20StrategyDeployed;
  var SymbolRegistryDeployed;
  var TransferModuleDeployed;
  var WhiteListDeployed;
  var SLS20VerificationDeployed;
  
  deployer.deploy(SymbolRegistry, {gas: 1800000})
  .then((instance) => {
    SymbolRegistryDeployed = instance;
    return deployer.deploy(TokensFactory, SymbolRegistryDeployed.address, {gas: 1600000})
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(WhiteList, tokensFactoryDeployed.address, {gas: 800000});
    })
    .then((instance) => {
      WhiteListDeployed = instance;
      return deployer.deploy(SLS20Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      SLS20VerificationDeployed = instance;
      return deployer.deploy(TransferModule, tokensFactoryDeployed.address, {gas: 800000});
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(SLS20Strategy, {gas: 3600000}); 
    })
    .then((instance) => {
      SLS20StrategyDeployed = instance;
      return deployer.deploy(ERC20Strategy, {gas: 3600000});
    })
    .then((instance) => {
      ERC20StrategyDeployed = instance;
      return tokensFactoryDeployed.addTokenStrategy(SLS20StrategyDeployed.address, {gas: 120000});
    })
    .then((instance) => {
      return tokensFactoryDeployed.addTokenStrategy(ERC20StrategyDeployed.address, {gas: 120000});
    })
    .then(() => {
      return SLS20StrategyDeployed.setTransferModule(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return SLS20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(SLS20VerificationDeployed.address, standard, {gas: 120000});
    });
  });
};
