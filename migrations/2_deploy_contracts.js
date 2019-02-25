var SymbolRegistry = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SRStorage = artifacts.require("./registry-layer/symbol-registry/eternal-storage/SRStorage.sol");
var TokensFactory = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var TFStorage = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var CAT20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var CAT721Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var ERC20Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/ERC20Strategy.sol");
var ComponentsRegistry = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");

var TransferModule = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var TCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCStorage = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var WhiteList = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteList.sol");
var WhiteListWithIds = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-service/WhiteListWithIds.sol");

var CAT721Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT721Verification.sol");
var CAT20Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT20Verification.sol");
var CAT1400Verification = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/CAT1400Verification.sol");

var PermissionModule = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");
var PMStorage = artifacts.require("./request-verification-layer/permission-module/eternal-storages/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");

var AppRegistry = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var AppRegistryStorage = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");

var Identity = artifacts.require("./registry-layer/identity/Identity.sol");
var TokensPolicyRegistry = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");
var PolicyParser = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");
var RulesEngine = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/RulesEngine.sol");

var CAT20TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT20TransferAction.sol");
var CAT1400TransferAction = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT1400TransferAction.sol");

var setupV1 = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20-V2/token-setup/SetupV1.sol");
var CAT20V2Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");

var setup1400V1 = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-1400/token-setup/SetupCAT1400V1.sol");
var CAT1400Strategy = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");

// CAT-20-V2 functions
var ERC20Functions = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/ERC20Functions.sol");
var CAT20Mint = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20MintFunction.sol");
var CAT20TransferWithWL = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVTransferFunction.sol");
var CAT20TransferWithRE = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20REVTransferFunction.sol");
var CAT20ClawbackWithWL = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVClawbackFunction.sol");

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


function createId(signature) {
  let hash = web3.utils.keccak256(signature);

  return hash.substring(0, 10);
}

module.exports = function(deployer, network, accounts) {
  var tokensFactoryDeployed;
  var CAT20StrategyDeployed;
  var CAT721StrategyDeployed;
  var CAT1400StrategyDeployed;
  var CAT1400VerificationDeployed;
  var CAT1400TransferActionDeployed;
  var setup1400V1Deployed;
  var ERC20StrategyDeployed;
  var SymbolRegistryDeployed;
  var TransferModuleDeployed;
  var WhiteListDeployed;
  var WhiteListWithIdsDeployed;
  var CAT721VerificationDeployed;
  var PermissionModuleDeployed;
  var ComponentsRegistryDeployed;
  var AppRegDeployed;
  var AppRegStorageDeployed;
  var SRStorageDeployed;
  var TFStorageDeployed;
  var PMStorageDeployed;
  var PMEStorageDeployed;
  var TCStorageDeployed;
  var FCStorageDeployed;
  var SetupV1Deployed;
  var CAT20V2StrategyDeployed;

  var systemRole = web3.utils.toHex("System");
  var ownerRole = web3.utils.toHex("Owner");
  
  deployer.deploy(ComponentsRegistry, {gas: 6400000})
  .then((instance) => {
    ComponentsRegistryDeployed = instance;
    return deployer.deploy(Identity, ComponentsRegistryDeployed.address, {gas: 3800000})
    .then((instance) => {
      IdentityDeployed = instance;
      return deployer.deploy(TokensPolicyRegistry, ComponentsRegistryDeployed.address, {gas: 3800000})
    })
    .then((instance) => {
      PolicyRegistryDeployed = instance;
      return deployer.deploy(RulesEngine, ComponentsRegistryDeployed.address, {gas: 3800000})
    })
    .then((instance) => {
      RulesEngineDeployed = instance;
      return deployer.deploy(PolicyParser, IdentityDeployed.address, {gas: 3800000})
    })
    .then((instance) => {
      PolicyParserDeployed = instance;
      return deployer.deploy(CAT20TransferAction, PolicyRegistryDeployed.address, PolicyParserDeployed.address, ComponentsRegistryDeployed.address, {gas: 4000000})
    })
    .then((instance) => {
      CAT20TransferActionDeployed = instance;
      return deployer.deploy(PMStorage, ComponentsRegistryDeployed.address, {gas: 3800000})
    })
    .then((instance) => {
      PMStorageDeployed = instance;
      return deployer.deploy(PMEST, ComponentsRegistryDeployed.address, PMStorageDeployed.address, {gas: 5000000})
    })
    .then((instance) => {
      PMEStorageDeployed = instance;
      return deployer.deploy(PermissionModule, ComponentsRegistryDeployed.address, PMStorageDeployed.address, PMEStorageDeployed.address, {gas: 6600000})
    })
    .then((instance) => {
      PermissionModuleDeployed = instance;
      return deployer.deploy(SRStorage, ComponentsRegistryDeployed.address, {gas: 3100000})
    })
    .then((instance) => {
      SRStorageDeployed = instance;
      return deployer.deploy(SymbolRegistry, ComponentsRegistryDeployed.address, SRStorageDeployed.address, {gas: 3500000})
    })
    .then((instance) => {
      SymbolRegistryDeployed = instance;
      return deployer.deploy(TFStorage, ComponentsRegistryDeployed.address, {gas: 4100000})
    })
    .then((instance) => {
      TFStorageDeployed = instance;
      return deployer.deploy(TokensFactory, ComponentsRegistryDeployed.address, TFStorageDeployed.address, {gas: 4100000})
    })
    .then((instance) => {
      tokensFactoryDeployed = instance;
      return deployer.deploy(WhiteList, ComponentsRegistryDeployed.address, {gas: 1200000});
    })
    .then((instance) => {
      WhiteListDeployed = instance;
      return deployer.deploy(WhiteListWithIds, ComponentsRegistryDeployed.address, {gas: 1400000});
    })
    .then((instance) => {
      WhiteListWithIdsDeployed = instance;
      return deployer.deploy(TCStorage, ComponentsRegistryDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      TCStorageDeployed = instance;
      return deployer.deploy(CAT20Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT20VerificationDeployed = instance;
      return deployer.deploy(CAT1400Verification, WhiteListWithIdsDeployed.address, {gas: 1000000});
    })
    .then((instance) => {
      CAT1400VerificationDeployed = instance;
      return deployer.deploy(FCStorage, ComponentsRegistryDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      FCStorageDeployed = instance;
      return deployer.deploy(TransferModule, ComponentsRegistryDeployed.address, TCStorageDeployed.address, FCStorageDeployed.address, {gas: 6200000});
    })
    .then((instance) => {
      TransferModuleDeployed = instance;
      return deployer.deploy(CAT20Strategy, ComponentsRegistryDeployed.address, {gas: 6600000}); 
    })
    .then((instance) => {
      CAT20StrategyDeployed = instance;
      return deployer.deploy(ERC20Strategy, ComponentsRegistryDeployed.address, {gas: 3700000});
    })
    .then((instance) => {
      ERC20StrategyDeployed = instance;
      return deployer.deploy(CAT721Strategy, ComponentsRegistryDeployed.address, {gas: 5700000});
    })
    .then((instance) => {
      CAT721StrategyDeployed = instance;
      return deployer.deploy(CAT721Verification, WhiteListDeployed.address, {gas: 500000});
    })
    .then((instance) => {
      CAT721VerificationDeployed = instance;
      return deployer.deploy(AppRegistryStorage, ComponentsRegistryDeployed.address, {gas: 4100000});
    })
    .then((instance) => {
      AppRegStorageDeployed = instance;
      return deployer.deploy(AppRegistry, ComponentsRegistryDeployed.address, AppRegStorageDeployed.address, {gas: 6400000});
    })
    .then((instance) => {
      AppRegDeployed = instance;
      return deployer.deploy(setupV1, {gas: 3000000});
    })
    .then((instance) => {
      SetupV1Deployed = instance;
      return deployer.deploy(CAT20V2Strategy, ComponentsRegistryDeployed.address, SetupV1Deployed.address, {gas: 4000000});
    })
    .then((instance) => {
      CAT20V2StrategyDeployed = instance;
      return deployer.deploy(setup1400V1, {gas: 3000000});
    })
    .then((instance) => {
      setup1400V1Deployed = instance;
      return deployer.deploy(CAT1400Strategy, ComponentsRegistryDeployed.address, setup1400V1Deployed.address, {gas: 4000000});
    })
    .then((instance) => {
      CAT1400StrategyDeployed = instance;
      return deployer.deploy(ERC20Functions, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400TransferAction, PolicyRegistryDeployed.address, PolicyParserDeployed.address, ComponentsRegistryDeployed.address, {gas: 4000000});
    })
    .then((instance) => {
      CAT1400TransferActionDeployed = instance;
      return deployer.deploy(CAT20Mint, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT20TransferWithWL, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT20TransferWithRE, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT20ClawbackWithWL, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400ERC20Functions, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(BalanceOfByPartitionFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400REVClawbackFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400WLVClawbackFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400REVTransferFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400WLVTransferFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400WLMint, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400REMint, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(SetDefaultPratitionFn, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400WLTransferByPartition, {gas:1000000});
    })
    .then(() => {
      return deployer.deploy(CAT1400RETransferByPartition, {gas:1000000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.initializePermissionModule(PermissionModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return PermissionModuleDeployed.createRole(systemRole, ownerRole, {gas: 300000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addTokenStrategy(address)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addVerificationLogic(address,bytes32)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("setTransferModule(address)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("addNewChain(bytes32)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("removeChain(bytes32)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("registerNewComponent(address)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addMethodToTheRole(createId("setActionExecutor(bytes32,address)"), systemRole, {gas: 500000});
    })
    .then(() => {
      return PermissionModuleDeployed.addRoleToTheWallet(accounts[0], systemRole, {gas:300000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(TransferModuleDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(tokensFactoryDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(SymbolRegistryDeployed.address, {gas: 120000});
    })
    .then(() => {
      return ComponentsRegistryDeployed.registerNewComponent(AppRegDeployed.address, {gas: 120000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT20StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(ERC20StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT20V2StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT721StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return tokensFactoryDeployed.addTokenStrategy(CAT1400StrategyDeployed.address, {gas: 160000});
    })
    .then(() => {
      return RulesEngineDeployed.setActionExecutor("0xa9059cbb", CAT20TransferActionDeployed.address, {gas: 200000});
    })
    .then(() => {
      return CAT20StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return CAT20V2StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT20VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return TransferModuleDeployed.addVerificationLogic(CAT20TransferActionDeployed.address, "0x6a770c78", {gas: 120000});
    })
    .then(() => {
      return CAT721StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT721VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return CAT1400StrategyDeployed.getTokenStandard();
    })
    .then((standard) => {
      return TransferModuleDeployed.addVerificationLogic(CAT1400VerificationDeployed.address, standard, {gas: 120000});
    })
    .then(() => {
      return TransferModuleDeployed.addVerificationLogic(CAT1400TransferActionDeployed.address, "0x4341542d", {gas: 120000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x476f436861696e", {gas: 180000});
    })
    .then(() => {
      return TransferModuleDeployed.addNewChain("0x457468657265756d", {gas: 180000});
    });
  });
};