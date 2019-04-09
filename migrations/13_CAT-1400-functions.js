// CAT-1400 functions
var CAT1400ERC20Functions = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400ERC20.sol");
var BalanceOfByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400BalanceOfByPartition.sol");
var CAT1400Clawback = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400Clawback.sol");
var CAT1400Mint = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400Mint.sol");
var CAT1400TransferByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400TransferByPartition.sol");
var CAT1400TransferWithoutVerification = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400TransferWithoutVerification.sol");
var CAT1400REVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400REVerifyTransfer.sol");
var CAT1400WLVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLVerifyTransfer.sol");

module.exports = async function(deployer) {
  await deployer.deploy(CAT1400ERC20Functions, {gas:1200000});
  await deployer.deploy(BalanceOfByPartition, {gas:800000});
  await deployer.deploy(CAT1400Clawback, {gas:1200000});
  await deployer.deploy(CAT1400Mint, {gas:800000});
  await deployer.deploy(CAT1400TransferByPartition, {gas:800000});
  await deployer.deploy(CAT1400TransferWithoutVerification, {gas:800000});
  await deployer.deploy(CAT1400REVerifyTransfer, {gas:800000});
  await deployer.deploy(CAT1400WLVerifyTransfer, {gas:800000});
};