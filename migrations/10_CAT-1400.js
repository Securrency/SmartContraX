var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var WhiteListWithIds = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteListWithIds.sol");
var CAT1400Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT1400Verification.sol");
var TokensPolicyRegistry = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");
var PolicyParser = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");
var CAT1400TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT1400TransferAction.sol");
var setup1400V1 = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-1400/token-setup/SetupCAT1400V1.sol");
var CAT1400Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
  var PolicyParserDeployed = await PolicyParser.deployed();
  var PolicyRegistryDeployed = await TokensPolicyRegistry.deployed();
  var WhiteListWithIdsDeployed = await WhiteListWithIds.deployed();

  await deployer.deploy(CAT1400Verification, WhiteListWithIdsDeployed.address, {gas: 1000000});
  await deployer.deploy(setup1400V1, {gas: 1000000});
  await deployer.deploy(CAT1400Strategy, ComponentsRegistryDeployed.address, setup1400V1.address, {gas: 1200000});
  await deployer.deploy(CAT1400TransferAction, PolicyRegistryDeployed.address, PolicyParserDeployed.address, ComponentsRegistryDeployed.address, {gas: 1700000});
};