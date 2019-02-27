var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var CAT721Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT721Verification.sol");
var CAT20Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT20Verification.sol");
var CAT20TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT20TransferAction.sol");
var CAT1400Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT1400Verification.sol");
var CAT1400TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT1400TransferAction.sol");
var CAT20V2Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");
var CAT1400Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");

module.exports = async function(deployer, network, accounts) {
  var CAT20StrategyDeployed = await CAT20Strategy.deployed();
  var TransferModuleDeployed = await TransferModule.deployed();
  var CAT20V2StrategyDeployed = await CAT20V2Strategy.deployed();
  var CAT20VerificationDeployed = await CAT20Verification.deployed();
  var CAT20TransferActionDeployed = await CAT20TransferAction.deployed();
  var CAT721StrategyDeployed = await CAT721Strategy.deployed();
  var CAT721VerificationDeployed = await CAT721Verification.deployed();
  var CAT1400StrategyDeployed = await CAT1400Strategy.deployed();
  var CAT1400VerificationDeployed = await CAT1400Verification.deployed();
  var CAT1400TransferActionDeployed = await CAT1400TransferAction.deployed();

  var CAT20Standard = await CAT20StrategyDeployed.getTokenStandard();
  await TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, CAT20Standard, {gas: 120000});
  
  var CAT20V2Stadard = await CAT20V2StrategyDeployed.getTokenStandard();
  await TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, CAT20V2Stadard, {gas: 120000});

  var CAT20RE = "0x6a770c78";
  await TransferModuleDeployed.addVerificationLogic(CAT20TransferActionDeployed.address, CAT20RE, {gas: 120000});

  var CAT721Standard = await CAT721StrategyDeployed.getTokenStandard();
  await TransferModuleDeployed.addVerificationLogic(CAT721VerificationDeployed.address, CAT721Standard, {gas: 120000});

  var CAT1400Stadard = await CAT1400StrategyDeployed.getTokenStandard();
  await TransferModuleDeployed.addVerificationLogic(CAT1400VerificationDeployed.address, CAT1400Stadard, {gas: 120000});

  var CAT1400RE = "0x4341542d";
  await TransferModuleDeployed.addVerificationLogic(CAT1400TransferActionDeployed.address, CAT1400RE, {gas: 120000});

  await TransferModuleDeployed.addNewChain("0x476f436861696e", {gas: 180000});
  await TransferModuleDeployed.addNewChain("0x457468657265756d", {gas: 180000});
};