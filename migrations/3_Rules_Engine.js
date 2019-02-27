var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

var Identity = artifacts.require("./registry-layer/identity/Identity.sol");
var TokensPolicyRegistry = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");
var PolicyParser = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");
var RulesEngine = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/RulesEngine.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
  var IdentityDeployed = await Identity.deployed();
  await deployer.deploy(TokensPolicyRegistry, ComponentsRegistryDeployed.address, {gas: 1500000});
  await deployer.deploy(RulesEngine, ComponentsRegistryDeployed.address, {gas: 800000});
  await deployer.deploy(PolicyParser, IdentityDeployed.address, {gas: 1800000});
};