const BigNumber = require("bignumber.js");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteList.sol");
var CAT20V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT20Verification.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var PMEST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMETokenRolesStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT-20/CAT20Token.sol");

var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

const txRevertNotification = "Transaction should fail!";

contract('TransferModule', accounts => {
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

    let CAT20Token;
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    let whiteList;
    let transferModule;
    let CAT20Verification;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;
    let PMETokenStorage;
    let SRStorage;
    let TFStorage;
    let PMStorage;
    let TCStorage;
    let FCStorage;

    let crossChainTx;

    let ownerRoleName = web3.utils.toHex("Owner");
    let systemRoleName = web3.utils.toHex("System");
    let registrationRoleName = web3.utils.toHex("Registration");
    let issuerRoleName = web3.utils.toHex("Issuer");
    let complianceRoleName = web3.utils.toHex("Compliance");

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components Registry contract was not deployed"
        );

        let tx;
        let status;

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        PMETokenStorage = await PMEST.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), PMETokenStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module contract was not deployed"
        );

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PermissionModule contract was not deployed"
        );

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
        
        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });
        
        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });
        
        let addChain = createId("addNewChain(bytes32)");
        tx = await permissionModule.addMethodToTheRole(addChain, systemRoleName, { from: accounts[0] });

        let remChain = createId("removeChain(bytes32)");
        tx = await permissionModule.addMethodToTheRole(remChain, systemRoleName, { from: accounts[0] });
        
        let accTokensFromChain = createId("acceptTokensFromOtherChain(address,address,address,bytes32,bytes32,bytes32,uint256,uint256)");
        tx = await permissionModule.addMethodToTheRole(accTokensFromChain, systemRoleName, { from: accounts[0] });

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        let removeFormWLId = createId("removeFromWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(removeFormWLId, complianceRoleName, { from: accounts[0] });

        let addArrayToWLId = createId("addArrayToWhiteList(address[],address)");
        tx = await permissionModule.addMethodToTheRole(addArrayToWLId, complianceRoleName, { from: accounts[0] });

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

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

        CAT20Strategy = await CAT20S.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT20Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
        let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
        assert.notEqual(tx.receipt.rawLogs[0].topics.indexOf(topic), -1);

        let standard = await CAT20Strategy.getTokenStandard();

        let hexSymbol = web3.utils.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, web3.utils.toHex(""), { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
        assert.notEqual(tx.receipt.rawLogs[3].topics.indexOf(topic), -1);
        tokenAddress = tx.receipt.rawLogs[3].topics[1].replace("000000000000000000000000", "");

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT20Token = await DSToken.at(tokenAddress);

        tx = await permissionModule.addRoleForSpecificToken(accounts[0], tokenAddress, complianceRoleName, { from: accounts[0] });

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            PermissionModule: ${permissionModule.address}
            SRStorage: ${SRStorage.address}
            TFStorage: ${TFStorage.address}
            PMStorage: ${PMStorage.address}
            SymbolRegistry: ${symbolRegistry.address}
            TokensFactory: ${TokensFactory.address}
            CAT20Strategy: ${CAT20Strategy.address}
            CAT20Token: ${CAT20Token.address}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}
            TCStorage: ${TCStorage.address}
            FCStorage: ${FCStorage.address}\n
        `);
    });

    describe("Test transfer module", async() => {
        it("Should add CAT20Verification to transfer module", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let tx = await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);

            assert.equal(tx.logs[0].args.standard, standard);
            assert.equal(tx.logs[0].args.tvAddress, CAT20Verification.address.valueOf());
        });

        it("Should add account to the whitelist", async() => {
            let tx = await whiteList.addToWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_owner, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_owner);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());
        });
        
        it("Should returns 'true' in the CAT20Verification", async() => {
            let tx = await CAT20Verification.verifyTransfer(
                token_owner,
                token_holder_1, 
                token_owner, 
                CAT20Token.address.valueOf(), 
                toTransfer,
                { from: token_owner }
            );

            assert.equal(tx, true);
        });

        it("Should returns 'false' in the CAT20Verification", async() => {
            let tx = await CAT20Verification.verifyTransfer(
                token_owner,
                token_holder_2, 
                token_owner, 
                CAT20Token.address.valueOf(), 
                toTransfer,
                { from: token_owner }
            );

            assert.equal(tx, false);
        });

        it("Should be transferred tokens on the account which is in the whitelist", async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer);

            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_1);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toTransfer.valueOf());
        });

        it("Should be failed to transfer on account that is not in whitelist", async() => {
            let errorThrown = false;
            try {
                await CAT20Token.transfer(token_holder_2, toTransfer);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Account is not in whitelist.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should add the previous account to the whitelist and successfully transfer", async() => {
            let tx = await whiteList.addToWhiteList(token_holder_2, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_2);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());
            
            tx = await CAT20Token.transfer(token_holder_2, toTransfer);

            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_2);
            assert.equal(new BigNumber(tx.logs[0].args.value).valueOf(), toTransfer.valueOf());
        });

        it("Should add multiple accounts to the whitelist", async() => {
            let investors = [accounts[7], accounts[8], accounts[9]];
            await whiteList.addArrayToWhiteList(investors, CAT20Token.address.valueOf(), { from: token_owner });

            for (let i = 0; i < investors.length; i++) {
                let result = await whiteList.presentInWhiteList(investors[i], CAT20Token.address.valueOf());
                assert.equal(result, true);
            }
        });

        it("Should remove account from the whitelist", async() => {
            let tx = await whiteList.removeFromWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());
        });
    });

    describe("Test cross chain service", async() => {
        it("Should add new chain", async() => {
            let chain = web3.utils.toHex("Ethereum Classic");
            let tx = await transferModule.addNewChain(chain);
            
            assert.equal(chain, tx.logs[0].args.chain.replace("00000000000000000000000000000000", ""));
        });

        it("Should add one more chain", async() => {
            let chain = web3.utils.toHex("Ethereum");
            let tx = await transferModule.addNewChain(chain);
            
            assert.equal(chain, tx.logs[0].args.chain.replace("000000000000000000000000000000000000000000000000", ""));
        });

        it("Should verify chain", async() => {
            let chain = web3.utils.toHex("Ethereum");
            let result = await transferModule.isSupported(chain);

            assert.equal(result, true);
        });

        it("Should remove chain", async() => {
            let chain = web3.utils.toHex("Ethereum");
            let tx = await transferModule.removeChain(chain);
            
            assert.equal(chain, tx.logs[0].args.chain.replace("000000000000000000000000000000000000000000000000", ""));
        });
    });

    describe("Test cross chain transfer", async() => {
        it("Should create cross chain transfer", async() => {
            let chain = web3.utils.toHex("Ethereum Classic");
            let tx = await CAT20Token.crossChainTransfer(toTransfer, chain, accounts[7], { from: token_owner });

            assert.equal(tx.logs[0].args.to, "0x0000000000000000000000000000000000000000");
            assert.equal(tx.logs[0].args.from, token_owner);

            crossChainTx = tx.tx;
        });

        it("Should accept tokens from other chain", async() => {
            let tx = await web3.eth.getTransactionReceipt(crossChainTx);

            let token = tx.logs[2].topics[1].replace("000000000000000000000000", "");
            let sender = tx.logs[2].topics[2].replace("000000000000000000000000", "");
            let id = parseInt(tx.logs[2].topics[3]);

            let data = tx.logs[2].data.replace("0x", "");

            let chain = "0x" + data.substring(0, 64).replace("00000000000000000000000000000000", "");
            let recipient = "0x" + data.substring(64, 104);

            let balance1 = new BigNumber(await CAT20Token.balanceOf(accounts[7]));

            tx = await transferModule.acceptTokensFromOtherChain(
                token,
                recipient,
                token,
                sender,
                chain,
                crossChainTx,
                toTransfer,
                id,
                { from: accounts[0] }
            );

            let balance2 = new BigNumber(await CAT20Token.balanceOf(accounts[7])); 
            
            assert.equal(balance1.valueOf(), 0);
            assert.equal(balance2.valueOf(), toTransfer.valueOf());
        });

        it("Should show that transaction is processed", async() => {
            let result = await transferModule.crossChainTxIsProcessed(crossChainTx);

            assert.equal(result, true);
        });

        it("Should fail activate already processed transaction", async() => {
            let tx = await web3.eth.getTransactionReceipt(crossChainTx);

            let token = tx.logs[2].topics[1].replace("000000000000000000000000", "");
            let sender = tx.logs[2].topics[2].replace("000000000000000000000000", "");
            let id = parseInt(tx.logs[2].topics[3]);

            let data = tx.logs[2].data.replace("0x", "");

            let chain = "0x" + data.substring(0, 64).replace("00000000000000000000000000000000", "");
            let recipient = "0x" + data.substring(64, 104);
            
            let errorThrown = false;
            try {
                await transferModule.acceptTokensFromOtherChain(
                    token,
                    recipient,
                    token,
                    sender,
                    chain,
                    crossChainTx,
                    toTransfer,
                    id,
                    { from: accounts[0] }
                );
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Transaction already processed.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });
    }); 
});