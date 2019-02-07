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
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20V2Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/interfaces/ICAT20Token.sol");
var ESC = artifacts.require("./common/mocks/EscrowClient.sol");
var RE = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/RulesEngine.sol");
var CAT20TA = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/actions/CAT20TransferAction.sol");
var PP = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/rules-engine/core/PolicyParser.sol");
var ID = artifacts.require('./registry-layer/identity/Identity.sol');
var TPR = artifacts.require("./registry-layer/tokens-policy-registry/TokensPolicyRegistry.sol");

var SET = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/token-setup/SetupV1.sol");

// CAT-20 token methods
var E20F = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/ERC20Functions.sol");
var C20MF = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20MintFunction.sol");
var C20TF = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVTransferFunction.sol");
var C20RETF = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20REVTransferFunction.sol");
var C20CBF = artifacts.require("./registry-layer/tokens-factory/token/CAT-20-V2/CAT-20-functions/CAT20WLVClawbackFunction.sol");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteList.sol");
var CAT20V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT20Verification.sol");

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

contract("CAT20Token (V2)", accounts => {
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
    const toApprove = new BigNumber(10).mul(precision);

    let CAT20Token;
    let whiteList;
    let transferModule;
    let CAT20Verification;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;
    let EscrowClient;
    let setupSM;
    let ERC20Functions;
    let CAT20MintFunction;
    let CAT20WLVTransferFunction;
    let CAT20REVTransferFunction
    let CAT20WLVClawbackFunction;
    let policyRegistry;
    let rulesEngine;
    let identity;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    var emptyBytes = web3.utils.toHex("");

    var countyAttr = "0x636f756e74727900000000000000000000000000000000000000000000000000";
    var US = "0x5553000000000000000000000000000000000000000000000000000000000000";
    
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

        CAT20TransferAction = await CAT20TA.new(policyRegistry.address.valueOf(), policyParser.address.valueOf(), componentsRegistry.address.valueOf());
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

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            zeroAddress,
            "PermissionModule contract was not deployed"
        );

        let ownerRoleName = web3.utils.toHex("Owner");
        let systemRoleName = web3.utils.toHex("System");
        let registrationRoleName = web3.utils.toHex("Registration");
        let issuerRoleName = web3.utils.toHex("Issuer");
        let complianceRoleName = web3.utils.toHex("Compliance");

        let tx;
        let status;

        tx = componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());

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

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

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

        CAT20Verification = await CAT20V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "CAT20Vierification contract was not deployed"
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
            "CAT20V2Strategy contract was not deployed"
        );

        CAT20Strategy = await CAT20S.new(componentsRegistry.address.valueOf(), setupSM.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT20Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.rawLogs[0].topics.indexOf(topic), -1);

        let standard = await CAT20Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);
        await transferModule.addVerificationLogic(CAT20TransferAction.address.valueOf(), "0x6a770c78");

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

        CAT20Token = await DSToken.at(tokenAddress);

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

        await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
        await policyRegistry.setPolicy(CAT20Token.address, action, policy, { from: accounts[0] });
        await rulesEngine.setActionExecutor(action, CAT20TransferAction.address.valueOf(), { from: accounts[0] });

        // Deploy token functions
        ERC20Functions = await E20F.new();
        assert.notEqual(
            ERC20Functions.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with ERC-20 functions was not deployed"
        );

        CAT20MintFunction = await C20MF.new();
        assert.notEqual(
            ERC20Functions.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-20 mint function was not deployed"
        );

        CAT20WLVTransferFunction = await C20TF.new();
        assert.notEqual(
            CAT20WLVTransferFunction.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-20 transfer functions was not deployed"
        );

        CAT20REVTransferFunction = await C20RETF.new();
        assert.notEqual(
            CAT20WLVTransferFunction.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-20 transfer functions with rules engine was not deployed"
        );

        CAT20WLVClawbackFunction = await C20CBF.new();
        assert.notEqual(
            CAT20WLVClawbackFunction.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Contract with CAT-20 clawback functions was not deployed"
        );

        await CAT20Token.initializeToken(componentsRegistry.address.valueOf());

        let ids = [
            "0x18160ddd",//totalSupply()
            "0x70a08231",//balanceOf(address)
            "0x095ea7b3",//approve(address,uint256)
            "0xa9059cbb",//transfer(address,uint256)
            "0x23b872dd",//transferFrom(address,address,uint256)
            "0x40c10f19",//mint(address,uint256)
            "0x0cfbfcde"//clawback(address,address,uint256)
        ];

        let addrs = [
            ERC20Functions.address,
            ERC20Functions.address,
            ERC20Functions.address,
            CAT20WLVTransferFunction.address,
            CAT20WLVTransferFunction.address,
            CAT20MintFunction.address,
            CAT20WLVClawbackFunction.address
        ];

        await CAT20Token.setImplementations(ids, addrs);

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            SRStorage: ${SRStorage.address}
            TFStorage: ${TFStorage.address}
            PMStorage: ${PMStorage.address}
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            CAT20Strategy: ${CAT20Strategy.address}
            CAT20Token: ${CAT20Token.address}
            CAT20Setup: ${setupSM.address}
            ERC20Functions: ${ERC20Functions.address}
            CAT20WLVTransferFunction: ${CAT20WLVTransferFunction}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}
            TCStorage: ${TCStorage.address}
            FCStorage: ${FCStorage.address}
            EscrowClient: ${EscrowClient.address}\n
        `);
    });

    describe("Testing CAT-20-V2 token", async() => {
        it("Should add accounts to the whitelist", async() => {
            tx = await whiteList.addToWhiteList(token_owner, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(token_holder_2, CAT20Token.address.valueOf(), { from: token_owner });
            tx = await whiteList.addToWhiteList(accounts[9], CAT20Token.address.valueOf(), { from: token_owner });
        });

        it("Mint tokens", async() => {
            let tx = await CAT20Token.mint(token_owner, totalSupply, { from: token_owner});

            assert.equal(tx.logs[0].args.to, token_owner);
        });

        it("Should fail to mint tokens", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.mint(token_owner, totalSupply, { from: token_holder_2});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should show total supply", async() => {        
            let value = new BigNumber(await CAT20Token.totalSupply());
            assert.equal(value.valueOf(), totalSupply.valueOf());
        });

        it("Should get correct ballance", async() => {
            let balance = new BigNumber(await CAT20Token.balanceOf(token_owner));

            assert.equal(balance.valueOf(), totalSupply.valueOf());
        });

        it("Should transfer tokens from the owner account to account " + token_holder_1, async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toTransfer.valueOf());

            txForRollback = tx.tx;
        });

        it("Should transfer tokens from the owner account to account " + token_holder_2, async() => {
            let tx = await CAT20Token.transfer(token_holder_2, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_2);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toTransfer.valueOf());
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = new BigNumber(await CAT20Token.balanceOf(token_owner));

            assert.equal(balance.add(toTransfer.mul(2).valueOf()).valueOf(), totalSupply.valueOf());
        });

        it("Should fail to transfer tokens on the no whitelisted account", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.transfer(accounts[8], toTransfer, {from: token_owner});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should approve " + web3.utils.fromWei(toApprove.valueOf(), "ether") + symbol + " tokens for account " + token_holder_1, async() => {
            let tx = await CAT20Token.approve(token_holder_1, toApprove, {from: token_owner});
            
            assert.equal(tx.logs[0].args.owner, token_owner);
            assert.equal(tx.logs[0].args.spender, token_holder_1);
            assert.equal(new BigNumber(tx.logs[0].args.tokens).valueOf(), toApprove.valueOf());
        }); 

        it("Should transfer approved tokens", async() => {
            let tx = await CAT20Token.transferFrom(token_owner, token_holder_2, toApprove.valueOf(), {from: token_holder_1});

            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_2);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toApprove.valueOf());

            let balance = new BigNumber(await CAT20Token.balanceOf(token_holder_1));
            assert.equal(balance.valueOf(), toApprove.valueOf());
        });

        it("Clawback", async() => {
            let tx = await CAT20Token.clawback(token_holder_2, token_owner, toApprove.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.from, token_holder_2);
            assert.equal(tx.logs[0].args.to, token_owner);
        });

        it("Should fail to create clawback", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.clawback(token_owner, token_holder_2, toApprove.valueOf(), { from: token_holder_2 });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Declined by Permission Module.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update transfer functions implementations (with rules engine)", async() => {
            let ids = [
                "0xa9059cbb",//transfer(address,uint256)
                "0x23b872dd",//transferFrom(address,address,uint256)
            ];
            let addrs = [
                CAT20REVTransferFunction.address,
                CAT20REVTransferFunction.address,
            ];

            await CAT20Token.setImplementations(ids, addrs);
        });

        it("Should fail to transfer tokens with updated methods", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transfer was declined.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should transfer tokens with rules engine verification", async() => {
            await identity.setWalletAttribute(accounts[0], countyAttr, US, { from: accounts[0] });
            await identity.setWalletAttribute(accounts[1], countyAttr, US, { from: accounts[0] });

            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toTransfer.valueOf());
        });
    });
});