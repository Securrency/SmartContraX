var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var CAT721Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT721Verification.sol");

module.exports = async function(deployer) {
  var ComponentsRegistryDeployed = await ComponentsRegistry.deployed();
  var WhiteListDeployed = await WhiteList.deployed();

  await deployer.deploy(CAT721Strategy, ComponentsRegistryDeployed.address, {gas: 3700000});
  await deployer.deploy(CAT721Verification, WhiteListDeployed.address, {gas: 500000});
};