// CAT-20-V2 functions
var ERC20Functions = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/ERC20Functions.sol");
var CAT20Mint = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20MintFunction.sol");
var CAT20TransferWithWL = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVTransferFunction.sol");
var CAT20TransferWithRE = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20REVTransferFunction.sol");
var CAT20ClawbackWithWL = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVClawbackFunction.sol");

module.exports = async function(deployer) {
  await deployer.deploy(ERC20Functions, {gas:700000});
  await deployer.deploy(CAT20Mint, {gas:300000});
  await deployer.deploy(CAT20TransferWithWL, {gas:600000});
  await deployer.deploy(CAT20TransferWithRE, {gas:600000});
  await deployer.deploy(CAT20ClawbackWithWL, {gas:500000});
};