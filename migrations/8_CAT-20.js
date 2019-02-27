var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var CAT20Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT20Verification.sol");
var TokensPolicyRegistry = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");
var PolicyParser = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");

var CAT20TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT20TransferAction.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
  var PolicyParserDeployed = await PolicyParser.deployed();
  var PolicyRegistryDeployed = await TokensPolicyRegistry.deployed();
  var WhiteListDeployed = await WhiteList.deployed();

  await deployer.deploy(CAT20TransferAction, PolicyRegistryDeployed.address, PolicyParserDeployed.address, ComponentsRegistryDeployed.address, {gas: 1600000})
  await deployer.deploy(CAT20Verification, WhiteListDeployed.address, {gas: 500000});
  await deployer.deploy(CAT20Strategy, ComponentsRegistryDeployed.address, {gas: 6600000});
};