const fs = require("fs");
const BigNumber = require("bignumber.js");

var AR = artifacts.require("./registry-layer/application-registry/ApplicationRegistry.sol");
var ARS = artifacts.require("./registry-layer/application-registry/eternal-storage/ARStorage.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");
var CAT1400S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT1400Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/interfaces/ICAT1400Token.sol");
var ESC = artifacts.require("./common/mocks/EscrowClient.sol");
var RE = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/RulesEngine.sol");
var CAT1400TA = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT1400TransferAction.sol");
var PP = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");
var ID = artifacts.require('./registry-layer/identity/Identity.sol');
var TPR = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");

var SET = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/token-setup/CAT1400Setup.sol");

// CAT-1400 token methods
var CAT1400ERC20Functions = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400ERC20.sol");
var BalanceOfByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400BalanceOfByPartition.sol");
var CAT1400Clawback = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400Clawback.sol");
var CAT1400Mint = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400Mint.sol");
var CAT1400TransferByPartition = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400TransferByPartition.sol");
var CAT1400REVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400REVerifyTransfer.sol");
var CAT1400WLVerifyTransfer = artifacts.require("./registry-layer/tokens-factory/token/CAT-1400/functions/CAT1400WLVerifyTransfer.sol");


var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteListWithIds.sol");
var CAT1400V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT1400Verification.sol");

var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

const zeroAddress = "0x0000000000000000000000000000000000000000";
const action = "0xa9059cbb";
// country == US
const policy = fs.readFileSync("./test/common/test-token-policy-3").toString();

contract("CAT1400Token", accounts => {
    const precision = 1000000000000000000;
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = new BigNumber(100).mul(precision);

    const toTransfer = new BigNumber(10).mul(precision);

    let CAT1400Token;
    let whiteList;
    let transferModule;
    let CAT1400Verification;
    let CAT1400Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let PMSEtorage;
    let TCStorage;
    let FCStorage;
    let EscrowClient;
    let setupSM;
    let policyRegistry;
    let rulesEngine;
    let identity;

    let ownerRoleName = web3.utils.toHex("Owner");
    let systemRoleName = web3.utils.toHex("System");
    let registrationRoleName = web3.utils.toHex("Registration");
    let issuerRoleName = web3.utils.toHex("Issuer");
    let complianceRoleName = web3.utils.toHex("Compliance");
    let transferAgent = web3.utils.toHex("Transfer Agent");

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    var emptyBytes = web3.utils.toHex("");

    var countyAttr = "0x636f756e74727900000000000000000000000000000000000000000000000000";
    var US = "0x5553000000000000000000000000000000000000000000000000000000000000";
    // country == US
    const policy = fs.readFileSync("./test/common/test-token-policy-3").toString();
    
    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            zeroAddress,
            "Components Registry contract was not deployed"
        );

        identity = await ID.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Identity contract was not deployed"
        );

        rulesEngine = await RE.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Rules Engine contract was not deployed"
        );

        policyParser = await PP.new(identity.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            identity.address.valueOf(),
            zeroAddress,
            "Policy parser contract was not deployed"
        );

        policyRegistry = await TPR.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            policyRegistry.address.valueOf(),
            zeroAddress,
            "Tokens policy registry was not deployed"
        );

        CAT1400TransferAction = await CAT1400TA.new(policyRegistry.address.valueOf(), policyParser.address.valueOf(), componentsRegistry.address.valueOf());
        assert.notEqual(
            policyRegistry.address.valueOf(),
            zeroAddress,
            "CAT20 Transfer action contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            zeroAddress,
            "Permission module storage was not deployed"
        );

        PMEStorage = await PMEST.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMEStorage.address.valueOf(),
            zeroAddress,
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), PMEStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            zeroAddress,
            "PermissionModule contract was not deployed"
        );

        let tx;
        let status;

        tx = await componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

        tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(systemRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(registrationRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(issuerRoleName, systemRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(issuerRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(complianceRoleName, issuerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(complianceRoleName);
        assert.equal(status, true);

        tx = await permissionModule.createRole(transferAgent, issuerRoleName, {from: accounts[0]});
        status = await PMStorage.getRoleStatus(transferAgent);
        assert.equal(status, true);

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

        let addVLID = createId("addVerificationLogicWithId(address,bytes32,bytes32");
        tx = await permissionModule.addMethodToTheRole(addVLID, systemRoleName, { from: accounts[0] });

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });
        
        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        let cl = createId("clawback(address,address,uint256)");
        tx = await permissionModule.addMethodToTheRole(cl, complianceRoleName, { from: accounts[0] });

        let mt = createId("mint(address,uint256)");
        tx = await permissionModule.addMethodToTheRole(mt, complianceRoleName, { from: accounts[0] });

        let iBurn = createId("transferAgentBurn(address,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(iBurn, complianceRoleName, { from: accounts[0] });

        let rollbackId = createId("createRollbackTransaction(address,address,address,uint256,uint256,string)");
        tx = await permissionModule.addMethodToTheRole(rollbackId, complianceRoleName, { from: accounts[0] });

        let enRoll = createId("toggleRollbacksStatus()");
        tx = await permissionModule.addMethodToTheRole(enRoll, complianceRoleName, { from: accounts[0] });

        let p = createId("pause()");
        tx = await permissionModule.addMethodToTheRole(p, complianceRoleName, { from: accounts[0] });

        let unp = createId("unpause()");
        tx = await permissionModule.addMethodToTheRole(unp, complianceRoleName, { from: accounts[0] });

        let crEscr = createId("createEscrow(address,address,uint256,bytes,bytes,bytes32,bool,bool)");
        tx = await permissionModule.addMethodToTheRole(crEscr, complianceRoleName, { from: accounts[0] });

        let canEscr = createId("cancelEscrow(bytes32,bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(canEscr, complianceRoleName, { from: accounts[0] });

        let ptEscr = createId("processEscrow(bytes32,address,bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(ptEscr, complianceRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        let createTApp = createId("createTokenApp(address,address)");
        tx = await permissionModule.addMethodToTheRole(createTApp, complianceRoleName, { from: accounts[0] });

        let removeTApp = createId("removeTokenApp(address,address)");
        tx = await permissionModule.addMethodToTheRole(removeTApp, complianceRoleName, { from: accounts[0] });

        let changeTAppStatus = createId("changeTokenAppStatus(address,address,bool)");
        tx = await permissionModule.addMethodToTheRole(changeTAppStatus, complianceRoleName, { from: accounts[0] });

        let setImpl = createId("setImplementations(bytes4[],address[])");
        tx = await permissionModule.addMethodToTheRole(setImpl, complianceRoleName, { from: accounts[0] });

        let setP = createId("setPolicy(address,bytes32,bytes)");
        await permissionModule.addMethodToTheRole(setP, complianceRoleName, { from: accounts[0] });
        
        let setAttr = createId("setWalletAttribute(address,bytes32,bytes32)");
        await permissionModule.addMethodToTheRole(setAttr, systemRoleName, { from: accounts[0] });

        let setAE = createId("setActionExecutor(bytes32,address)");
        await permissionModule.addMethodToTheRole(setAE, systemRoleName, { from: accounts[0] });

        let mintByP = createId("mintByPartition(bytes32,address,uint256)");
        await permissionModule.addMethodToTheRole(mintByP, transferAgent, { from: accounts[0] });

        let addToWLIdW = createId("addToWhiteList(address,address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addToWLIdW, transferAgent, { from: accounts[0] });

        let CL = createId("clawbackByPartition(address,address,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(CL, transferAgent, { from: accounts[0] });

        let setPWID = createId("setPolicyWithId(address,bytes32,bytes32,bytes)");
        tx = await permissionModule.addMethodToTheRole(setPWID, transferAgent, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], complianceRoleName, { from: accounts[0] });

        SRStorage = await ES.new(componentsRegistry.address.valueOf());
        assert.notEqual(
            SRStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Symbol registry storage was not deployed"
        );

        symbolRegistry = await SR.new(componentsRegistry.address.valueOf(), SRStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(symbolRegistry.address.valueOf());

        TFStorage = await TFS.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TFStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Tokens factory storage was not deployed"
        );

        TokensFactory = await TF.new(componentsRegistry.address.valueOf(), TFStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(TokensFactory.address.valueOf());

        whiteList = await WL.new(componentsRegistry.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "WhiteList contract was not deployed"
        );

        CAT1400Verification = await CAT1400V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "CAT1400Vierification contract was not deployed"
        );

        TCStorage = await TCS.new(componentsRegistry.address, { from: token_owner });
        assert.notEqual(
            TCStorage.address.valueOf(),
            zeroAddress,
            "TCStorage contract was not deployed"
        );

        FCStorage = await FCS.new(componentsRegistry.address, { from: token_owner });
        assert.notEqual(
            FCStorage.address.valueOf(),
            zeroAddress,
            "FCStorage contract was not deployed"
        );

        transferModule = await TM.new(componentsRegistry.address.valueOf(), TCStorage.address.valueOf(), FCStorage.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );

        tx = componentsRegistry.registerNewComponent(transferModule.address.valueOf());

        setupSM = await SET.new();
        assert.notEqual(
            setupSM.address.valueOf(),
            zeroAddress,
            "Setup contract was not deployed"
        );

        CAT1400Strategy = await CAT1400S.new(componentsRegistry.address.valueOf(), setupSM.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT1400Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT1400Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.rawLogs[0].topics.indexOf(topic), -1);

        let standard = await CAT1400Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT1400Verification.address.valueOf(), standard);
        await transferModule.addVerificationLogic(CAT1400TransferAction.address.valueOf(), "0x4341542d");

        let hexSymbol = web3.utils.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, emptyBytes, { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
        assert.notEqual(tx.receipt.rawLogs[2].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.rawLogs[2].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT1400Token = await DSToken.at(tokenAddress);

        EscrowClient = await ESC.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Escrow client contract was not deployed"
        );

        ARStorage = await ARS.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            ARStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Application registry storage contract was not deployed"
        );

        applicationsRegistry = await AR.new(componentsRegistry.address.valueOf(), ARStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            applicationsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Application registry contract was not deployed"
        );

        tx = await componentsRegistry.registerNewComponent(applicationsRegistry.address.valueOf(), { from: accounts[0] });
        assert.equal(tx.logs[0].args.componentAddress, applicationsRegistry.address.valueOf());

        await permissionModule.addRoleForSpecificToken(token_owner, CAT1400Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
        
        await rulesEngine.setActionExecutor(action, CAT1400TransferAction.address.valueOf(), { from: accounts[0] });

        // Deploy token functions
        CAT1400Mint = await CAT1400Mint.new();
        assert.notEqual(
            CAT1400Mint.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 mint function was not deployed"
        );

        BalanceOfByPartition = await BalanceOfByPartition.new();
        assert.notEqual(
            BalanceOfByPartition.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 balanceOfByPartition function was not deployed"
        );

        CAT1400ERC20Functions = await CAT1400ERC20Functions.new();
        assert.notEqual(
            CAT1400ERC20Functions.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with ERC-20 functions was not deployed"
        );

        CAT1400Clawback = await CAT1400Clawback.new();
        assert.notEqual(
            CAT1400Clawback.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 clawback functions was not deployed"
        );

        CAT1400TransferByPartition = await CAT1400TransferByPartition.new();
        assert.notEqual(
            CAT1400TransferByPartition.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 transfer by partition function was not deployed"
        );

        CAT1400REVerifyTransfer = await CAT1400REVerifyTransfer.new();
        assert.notEqual(
            CAT1400REVerifyTransfer.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 transfer transfer verification by rules engine was not deployed"
        );

        CAT1400WLVerifyTransfer = await CAT1400WLVerifyTransfer.new();
        assert.notEqual(
            CAT1400WLVerifyTransfer.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-1400 transfer transfer verification by white list was not deployed"
        );

        await CAT1400Token.initializeToken(componentsRegistry.address.valueOf());

        let ids = [
            "0x18160ddd",//totalSupply()
            "0x70a08231",//balanceOf(address)
            "0x095ea7b3",//approve(address,uint256)
            "0xa9059cbb",//transfer(address,uint256)
            "0x23b872dd",//transferFrom(address,address,uint256)
            "0xf3d490db",//transferByPartition(bytes32,address,uint256,bytes)
            "0x06a69bfc",//mintByPartition(bytes32,address,uint256)
            "0x30e82803",//balanceOfByPartition(bytes32,address)
            "0x656f029f",//clawbackByPartition(address,address,uint256,bytes32)
            "0x484a5c54",//verifyTransfer(address,address,address,bytes32,uint256)
        ];

        let addrs = [
            CAT1400ERC20Functions.address,
            CAT1400ERC20Functions.address,
            CAT1400ERC20Functions.address,
            CAT1400ERC20Functions.address,
            CAT1400ERC20Functions.address,
            CAT1400TransferByPartition.address,
            CAT1400Mint.address,
            BalanceOfByPartition.address,
            CAT1400Clawback.address,
            CAT1400WLVerifyTransfer.address,
        ];

        await CAT1400Token.setImplementations(ids, addrs);
    });

    var partition1 = "0x536563757272656e63792e536d617274436f6e74726163747300000000000000";
    var tokensToMint = new BigNumber(100).mul(precision);
    var toApprove = tokensToMint.div(2);
    describe("Testing CAT-1400 token", async() => {
        it("Should add Transfer agent role", async() => {
            await permissionModule.addRoleForSpecificTokenWithSubId(
                token_owner,
                CAT1400Token.address.valueOf(),
                transferAgent,
                partition1, 
                { from: accounts[0] }
            );
            
            status = await PMEStorage.getTokenDependentRoleStatusWithSubId(
                accounts[0],
                CAT1400Token.address.valueOf(),
                transferAgent,
                partition1
            );
            
            assert.equal(status, true);
        });

        it("Should fail to to transfer tokens, accounts are not whitelisted", async() => {
            let errorThrown = false;
            try {
                await CAT1400Token.transferByPartition(partition1, accounts[1], tokensToMint.div(5), "0x00");
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined by WhiteList`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to to mint tokens, account is not whitelisted", async() => {
            let errorThrown = false;
            try {
                await CAT1400Token.mintByPartition(partition1, accounts[0], tokensToMint);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined by WhiteList`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should add accounts to the whitelist", async() => {
            await whiteList.addToWhiteList(accounts[0], CAT1400Token.address.valueOf(), partition1, { from: accounts[0] });
            await whiteList.addToWhiteList(accounts[1], CAT1400Token.address.valueOf(), partition1, { from: accounts[0] });
            await whiteList.addToWhiteList(accounts[2], CAT1400Token.address.valueOf(), partition1, { from: accounts[0] });
            await whiteList.addToWhiteList(accounts[3], CAT1400Token.address.valueOf(), partition1, { from: accounts[0] });
        });

        it("Should show that totalSupply is zero", async() => {
            let res = await CAT1400Token.totalSupply();
            assert.equal(new BigNumber(0).valueOf(), res.valueOf());
        });

        it("Should mint tokens by partition", async() => {
            let tx = await CAT1400Token.mintByPartition(partition1, accounts[0], tokensToMint);

            assert.equal(tx.logs[2].args.fromPartition, partition1);
            assert.equal(tx.logs[2].args.to, accounts[0]);
            assert.equal(new BigNumber(tx.logs[2].args.value).valueOf(), tokensToMint.valueOf());
        });

        it("Should show that totalSupply", async() => {
            let res = await CAT1400Token.totalSupply();
            assert.equal(tokensToMint.valueOf(), res.valueOf());
        });

        it("Should returns correct balance", async() => {
            let bal = new BigNumber(await CAT1400Token.balanceOfByPartition(partition1, accounts[0]));
            assert.equal(bal.valueOf(), tokensToMint.valueOf());
        });

        it("Should transfer tokens by partition", async() => {
            let tx = await CAT1400Token.transferByPartition(partition1, accounts[1], tokensToMint.div(5), "0x00");

            assert.equal(tx.logs[1].args.fromPartition, partition1);
            assert.equal(tx.logs[1].args.from, accounts[0]);
            assert.equal(tx.logs[1].args.to, accounts[1]);
            assert.equal(new BigNumber(tx.logs[1].args.value).valueOf(), tokensToMint.div(5).valueOf());
        });

        it("Should returns correct balance for the first", async() => {
            let bal = new BigNumber(await CAT1400Token.balanceOfByPartition(partition1, accounts[0]));
            assert.equal(bal.valueOf(), tokensToMint.sub(tokensToMint.div(5)).valueOf());
        });

        it("Should returns correct balance for the second token holder", async() => {
            let bal = new BigNumber(await CAT1400Token.balanceOfByPartition(partition1, accounts[1]));
            assert.equal(bal.valueOf(), tokensToMint.div(5).valueOf());
        });

        it("Should fail to create clawback", async() => {
            let errorThrown = false;
            try {
                await await CAT1400Token.clawbackByPartition(accounts[0], accounts[2], tokensToMint, partition1, { from: accounts[2] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to create clawback", async() => {
            let errorThrown = false;
            try {
                await await CAT1400Token.clawbackByPartition(accounts[0], accounts[9], tokensToMint, partition1, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
        
        it("Should create clawback", async() => {
            await CAT1400Token.mintByPartition(partition1, accounts[3], tokensToMint, { from: accounts[0] });

            let tx = await CAT1400Token.clawbackByPartition(accounts[3], accounts[2], tokensToMint, partition1, { from: accounts[0] });

            assert.equal(tx.logs[2].args.from, accounts[3]);
            assert.equal(tx.logs[2].args.to, accounts[2]);
            assert.equal(new BigNumber(tx.logs[2].args.value).valueOf(), tokensToMint.valueOf());

            let balance = new BigNumber(await CAT1400Token.balanceOfByPartition(partition1, accounts[2]));
            assert.equal(balance.valueOf(), tokensToMint.valueOf());
        });
    });

    describe("Backward compatible CAT-1400 with ERC-20", async() => {
        it("Should transfer tokens", async() => {
            let tx = await CAT1400Token.transfer(accounts[0], tokensToMint.div(5), {from: accounts[1]});
            
            assert.equal(tx.logs[0].args.from, accounts[1]);
            assert.equal(tx.logs[0].args.to, accounts[0]);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), tokensToMint.div(5).valueOf());
        });

        it("Should returns correct balance", async() => {
            let bal = new BigNumber(await CAT1400Token.balanceOf(accounts[0]));
            assert.equal(bal.valueOf(), tokensToMint.valueOf());
        });

        it("Should approve " + web3.utils.fromWei(toApprove.valueOf(), "ether") + symbol + " tokens for account " + token_holder_1, async() => {
            let tx = await CAT1400Token.approve(accounts[2], toApprove, {from: accounts[0]});
            
            assert.equal(tx.logs[0].args.owner, accounts[0]);
            assert.equal(tx.logs[0].args.spender, accounts[2]);
            assert.equal(new BigNumber(tx.logs[0].args.tokens).valueOf(), toApprove.valueOf());
        }); 

        it("Should transfer approved tokens", async() => {
            let tx = await CAT1400Token.transferFrom(accounts[0], accounts[1], toApprove.valueOf(), {from: accounts[2]});
        
            assert.equal(tx.logs[0].args.from, accounts[0]);
            assert.equal(tx.logs[0].args.to, accounts[1]);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toApprove.valueOf());

            let balance = new BigNumber(await CAT1400Token.balanceOf(accounts[1]));
            assert.equal(balance.valueOf(), toApprove.valueOf());
        });
    });

    describe("CAT-1400 upgradabilbity and rules engine", async() => {
        it("Should update transfer functions implementations (with rules engine)", async() => {
            let ids = [
                "0x484a5c54",//verifyTransfer(address,address,address,bytes32,uint256)
            ];
            let addrs = [
                CAT1400REVerifyTransfer.address,
            ];

            await CAT1400Token.setImplementations(ids, addrs);
        });

        it("Should fail to to transfer tokens by partition with updated methods", async() => {
            let errorThrown = false;
            try {
                await CAT1400Token.transferByPartition(partition1, accounts[0], tokensToMint.div(5), "0x00", { from: accounts[1] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined by WhiteList`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to transfer tokens with updated methods", async() => {
            let errorThrown = false;
            try {
                await CAT1400Token.transfer(accounts[1], tokensToMint.div(5), {from: accounts[0]});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to to mint tokens with Rules Engine", async() => {
            let errorThrown = false;
            try {
                await CAT1400Token.mintByPartition(partition1, accounts[3], tokensToMint, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined by WhiteList`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should set token policy for the specified partition", async() => {
            await policyRegistry.setPolicyWithId(CAT1400Token.address, action, partition1, policy, { from: accounts[0] });
        });

        it("Should transfer tokens with rules engine verification", async() => {
            await identity.setWalletAttribute(accounts[0], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[1], countyAttr, US, { from: accounts[0] });

            let tx = await CAT1400Token.transfer(accounts[1], tokensToMint.div(5), {from: accounts[0]});
            
            assert.equal(tx.logs[0].args.from, accounts[0]);
            assert.equal(tx.logs[0].args.to, accounts[1]);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), tokensToMint.div(5).valueOf());
        });

        it("Should mint tokens by partition with Rule Engine verificatio", async() => {
            await identity.setWalletAttribute(accounts[3], countyAttr, US, { from: accounts[0] });

            let tx = await CAT1400Token.mintByPartition(partition1, accounts[3], tokensToMint, { from: accounts[0] });

            assert.equal(tx.logs[1].args.fromPartition, partition1);
            assert.equal(tx.logs[1].args.to, accounts[3]);
            assert.equal(new BigNumber(tx.logs[1].args.value).valueOf(), tokensToMint.valueOf());
        });

        it("Should fail to create clawback with RE", async() => {
            let errorThrown = false;
            try {
                await await CAT1400Token.clawbackByPartition(accounts[0], accounts[2], tokensToMint, partition1, { from: accounts[2] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail to create clawback with RE", async() => {
            let errorThrown = false;
            try {
                await await CAT1400Token.clawbackByPartition(accounts[0], accounts[2], tokensToMint, partition1, { from: accounts[0] });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
        
        it("Should create clawback", async() => {
            await identity.setWalletAttribute(accounts[2], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[3], countyAttr, US, { from: accounts[0] });

            let tx = await CAT1400Token.clawbackByPartition(accounts[3], accounts[2], tokensToMint, partition1, { from: accounts[0] });

            assert.equal(tx.logs[2].args.from, accounts[3]);
            assert.equal(tx.logs[2].args.to, accounts[2]);
            assert.equal(new BigNumber(tx.logs[2].args.value).valueOf(), tokensToMint.valueOf());

            let balance = new BigNumber(await CAT1400Token.balanceOfByPartition(partition1, accounts[2]));
            assert.equal(balance.valueOf(), tokensToMint.mul(2).valueOf());
        });

        it("Should transfer tokens by partition with rules engine verification", async() => {
            let tx = await CAT1400Token.transferByPartition(partition1, accounts[3], tokensToMint.div(5), "0x00", { from: accounts[2] });

            assert.equal(tx.logs[1].args.fromPartition, partition1);
            assert.equal(tx.logs[1].args.from, accounts[2]);
            assert.equal(tx.logs[1].args.to, accounts[3]);
            assert.equal(new BigNumber(tx.logs[1].args.value).valueOf(), tokensToMint.div(5).valueOf());
        });
    });
});