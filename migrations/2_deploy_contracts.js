var SymbolRegistry = artifacts.require("./services/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./TokensFactory.sol");
var SLS20Strategy = artifacts.require("./tokens-strategies/SLS20Strategy.sol");

var TransferModule = artifacts.require("./modules/transfer/TransferModule.sol");
var WhiteList = artifacts.require("./modules/transfer/transfer-verification/WhiteList.sol");
var SLS20Verification = artifacts.require("./modules/transfer/verification-service/SLS20Verification.sol");

module.exports = function(deployer) {
  var tokensFactoryDeployed;
  var SLS20StrategyDeployed;
  var SymbolRegistryDeployed;
  var TransferModuleDeployed;
  var WhiteListDeployed;
  var SLS20VerificationDeployed;
  
  deployer.deploy(SymbolRegistry)
  .then((instance) => {
    SymbolRegistryDeployed = instance;
    return deployer.deploy(TokensFactory, SymbolRegistryDeployed.address)
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(WhiteList, tokensFactoryDeployed.address);
    })
    .then((instance) => {
      WhiteListDeployed = instance;
      return deployer.deploy(SLS20Verification, WhiteListDeployed.address);
    })
    .then((instance) => {
      SLS20VerificationDeployed = instance;
      return deployer.deploy(TransferModule, tokensFactoryDeployed.address);
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(SLS20Strategy); 
    })
    .then((instance) => {
      SLS20StrategyDeployed = instance;
      return tokensFactoryDeployed.addTokenStrategy(SLS20StrategyDeployed.address);
    })
    .then(() => {
      return SLS20StrategyDeployed.setTransferModule(TransferModuleDeployed.address);
    })
    .then(() => {
      return SLS20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(SLS20VerificationDeployed.address, standard);
    });
  });
};
