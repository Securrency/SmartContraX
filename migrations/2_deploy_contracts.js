var SymbolRegistry = artifacts.require("./services/SymbolRegistry.sol");
var TokensFactory = artifacts.require("./TokensFactory.sol");
var SLS20Strategy = artifacts.require("./tokens-strategies/SLS20Strategy.sol");

module.exports = function(deployer) {
  var tokensFactoryDeployed;
  var SLS20StrategyDeployed;
  var SymbolRegistryDeployed;
  
  deployer.deploy(SymbolRegistry)
  .then((instance) => {
    SymbolRegistryDeployed = instance;
    return deployer.deploy(TokensFactory, SymbolRegistryDeployed.address)
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(SLS20Strategy);
    })
    .then((instance) => {
      SLS20StrategyDeployed = instance;
      return tokensFactoryDeployed.addTokenStrategy(SLS20StrategyDeployed.address);
    });
  });
};
