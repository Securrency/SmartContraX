// CAT-20-V2 functions
var CAT20ERC20 = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20ERC20.sol");
var CAT20Mint = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Mint.sol");
var CAT20Burn = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Burnable.sol");
var CAT20Pause = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Pause.sol");
var CAT20Rollback = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Rollback.sol");
var CAT20Clawback = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Clawback.sol");
var CAT20REVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/verify-transfer/CAT20REVerifyTransfer.sol");
var CAT20WLVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/verify-transfer/CAT20WLVerifyTransfer.sol");
var CAT20TransferWithoutVerification = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/verify-transfer/CAT20TransferWithoutVerification.sol");
var CAT20Documents = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/functions/CAT20Documents.sol");

module.exports = async function(deployer) {
  await deployer.deploy(CAT20ERC20, {gas:1300000});
  await deployer.deploy(CAT20Mint, {gas:1100000});
  await deployer.deploy(CAT20Clawback, {gas:1100000}); 
  await deployer.deploy(CAT20REVerifyTransfer, {gas:1100000});
  await deployer.deploy(CAT20WLVerifyTransfer, {gas:1100000});
  await deployer.deploy(CAT20TransferWithoutVerification, {gas:1100000});
  await deployer.deploy(CAT20Burn, {gas:800000});
  await deployer.deploy(CAT20Pause, {gas:800000});
  await deployer.deploy(CAT20Rollback, {gas:1300000});
  await deployer.deploy(CAT20Documents, {gas:1300000});
};