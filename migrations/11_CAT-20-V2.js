var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var CAT20Setup = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20-V2/CAT20Setup.sol");
var CAT20V2Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(CAT20Setup, {gas: 1000000});
  await deployer.deploy(CAT20V2Strategy, ComponentsRegistryDeployed.address, CAT20Setup.address, {gas: 1300000});
};