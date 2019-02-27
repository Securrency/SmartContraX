// CAT-1400 functions
var CAT1400ERC20Functions = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400ERC20Functions.sol");
var BalanceOfByPartitionFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/BalanceOfByPartitionFn.sol");
var CAT1400REVClawbackFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400REVClawbackFn.sol");
var CAT1400WLVClawbackFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLVClawbackFn.sol");
var CAT1400REVTransferFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400REVTransferFn.sol");
var CAT1400WLVTransferFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLVTransferFn.sol");
var CAT1400WLMint = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLMint.sol");
var CAT1400REMint = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400REMint.sol");
var SetDefaultPratitionFn = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/SetDefaultPratitionFn.sol");
var CAT1400WLTransferByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLTransferByPartition.sol");
var CAT1400RETransferByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400RETransferByPartition.sol");

module.exports = async function(deployer) {
  await deployer.deploy(CAT1400ERC20Functions, {gas:800000});
  await deployer.deploy(BalanceOfByPartitionFn, {gas:200000});
  await deployer.deploy(CAT1400REVClawbackFn, {gas:600000});
  await deployer.deploy(CAT1400WLVClawbackFn, {gas:600000});
  await deployer.deploy(CAT1400REVTransferFn, {gas:600000});
  await deployer.deploy(CAT1400WLVTransferFn, {gas:1000000});
  await deployer.deploy(CAT1400WLMint, {gas:900000});
  await deployer.deploy(CAT1400REMint, {gas:900000});
  await deployer.deploy(SetDefaultPratitionFn, {gas:200000});
  await deployer.deploy(CAT1400WLTransferByPartition, {gas:500000});
  await deployer.deploy(CAT1400RETransferByPartition, {gas:500000});
};