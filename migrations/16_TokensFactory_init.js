var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var CAT20V2Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");
var CAT1400Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");

module.exports = async function(deployer, network, accounts) {
  var TokensFactoryDeployed = await TokensFactory.deployed();
  var CAT20StrategyDeployed = await CAT20Strategy.deployed();
  var CAT20V2StrategyDeployed = await CAT20V2Strategy.deployed();
  var CAT721StrategyDeployed = await CAT721Strategy.deployed();
  var CAT1400StrategyDeployed = await CAT1400Strategy.deployed();

  await TokensFactoryDeployed.addTokenStrategy(CAT20StrategyDeployed.address, {gas: 160000});
  await TokensFactoryDeployed.addTokenStrategy(CAT20V2StrategyDeployed.address, {gas: 160000});
  await TokensFactoryDeployed.addTokenStrategy(CAT721StrategyDeployed.address, {gas: 160000});
  await TokensFactoryDeployed.addTokenStrategy(CAT1400StrategyDeployed.address, {gas: 160000});
};