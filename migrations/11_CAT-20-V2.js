var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var setupV1 = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20-V2/token-setup/SetupV1.sol");
var CAT20V2Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();

  await deployer.deploy(setupV1, {gas: 600000});
  await deployer.deploy(CAT20V2Strategy, ComponentsRegistryDeployed.address, setupV1.address, {gas: 1200000});
};