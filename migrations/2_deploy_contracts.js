var TokensFactory = artifacts.require("./TokensFactory.sol");
var SLS20Strategy = artifacts.require("./tokens-strategies/SLS20Strategy.sol");

module.exports = function(deployer) {
  var tokensFactoryDeployed;
  var SLS20StrategyDeployed;
  
  deployer.deploy(TokensFactory)
  .then((instance) => {
    tokensFactoryDeployed = instance;
    return deployer.deploy(SLS20Strategy);
  })
  .then((instance) => {
    SLS20StrategyDeployed = instance;
    return tokensFactoryDeployed.addTokenStrategy(SLS20StrategyDeployed.address);
  });
};
