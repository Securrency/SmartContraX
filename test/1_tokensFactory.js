
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var TFS = artifacts.require("./registry-layer/tokens-factory/eternal-storage/TFStorage.sol");
var PMST = artifacts.require("./request-verification-layer/permission-module/eternal-storage/PMStorage.sol");
var TCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/TCStorage.sol");
var FCS = artifacts.require("./transfer-layer/cross-chain/eternal-storage/FCStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
var TSMock = artifacts.require("./common/mocks/TokenStrategyMock.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT20Token.sol");

var TM = artifacts.require("./transfer-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-verification-system/verification-service/WhiteList.sol");
var CAT20V = artifacts.require("./request-verification-layer/transfer-verification-system/transfer-verification/CAT20Verification.sol");

var PM = artifacts.require("./request-verification-layer/permission-module/PermissionModule.sol");

function createId(signature) {
    let hash = web3.sha3(signature);

    return hash.substring(0, 10);
}

function bytes32ToString(bytes32) {
    return web3.toAscii(bytes32).replace(/\0/g, '')
}

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract('TokensFactory', accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];
    const toTransfer = web3.toWei(10, "ether");
    const toApprove = web3.toWei(10, "ether");

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = web3.toWei(100000, "ether");

    let deployedTokenAddress;
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

    let invalidTokenStandard = "ST-JGAqabJmEZsm1PXh3DmN";

    const txRevertNotification = "Transaction should fail!";
    let zeroAddress = "0x0000000000000000000000000000000000000000";

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components Registry contract was not deployed"
        );

        PMStorage = await PMST.new(componentsRegistry.address.valueOf(), {from: accounts[0]});
        assert.notEqual(
            PMStorage.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Permission module storage was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), PMStorage.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            permissionModule.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PermissionModule contract was not deployed"
        );

        let ownerRoleName = "Owner";
        let systemRoleName = "System";
        let registrationRoleName = "Registration";
        let issuerRoleName = "Issuer";
        let complianceRoleName = "Compliance";

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

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        let removeStrategyId = createId("removeTokenStrategy(bytes32)");
        tx = await permissionModule.addMethodToTheRole(removeStrategyId, systemRoleName, { from: accounts[0] });

        let updateStrategyId = createId("updateTokenStrategy(bytes32,address)");
        tx = await permissionModule.addMethodToTheRole(updateStrategyId, systemRoleName, { from: accounts[0] });

        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

        let regCompId = createId("registerNewComponent(address)");
        tx = await permissionModule.addMethodToTheRole(regCompId, systemRoleName, { from: accounts[0] });

        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });

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

        TokenStrategyMock = await TSMock.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokenStrategyMock.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock contract was not deployed"
        );

        TokenStrategyMock2 = await TSMock.new(componentsRegistry.address.valueOf());

        assert.notEqual(
            TokenStrategyMock2.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock2 contract was not deployed"
        );

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
            TokenStrategyMock1:${TokenStrategyMock.address}
            TokenStrategyMock2:${TokenStrategyMock2.address}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}
            TCStorage: ${TCStorage.address}
            FCStorage: ${FCStorage.address}\n
        `);
    });

    describe("Test tokens factory", async() => {
        it("Should add new token strategy to the tokens factory", async() => {
            let tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });

            let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Should add CAT20Verification to transfer module", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let tx = await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);
            
            let topic = "0xef956dc4297ee86f5af7cb96c4208936ea515472ea1f5b315d8b9125c83c1ae8";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it ("Should fail to add existing token strategy", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Strategy already present.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it ("Should fail to add token strategy with invalid address", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.addTokenStrategy(zeroAddress, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid tokens strategy.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });
        
        it("Should update token strategy", async() => {
            // add then update and remove mock token strategy
            let tx = await TokensFactory.addTokenStrategy(TokenStrategyMock.address, { from : token_owner });
            let topic = "0x9bf07456b86b17320e4e8334cf1783b2ad1d7e33d589ede121035bc9f601e89f";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

            standard = await TokenStrategyMock.getTokenStandard();

            tx = await TokensFactory.updateTokenStrategy(standard, TokenStrategyMock2.address, { from : token_owner });
            topic = "0x0710dab9466831af48228f774c9e3c4c164c3c007b5529999eba93e70be606ed";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        }); 

        it("Should fail to update strategy with invalid address", async() => {
            let errorThrown = false;
            let standard = await TokenStrategyMock2.getTokenStandard();
            try {
                await TokensFactory.updateTokenStrategy(standard, zeroAddress, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Invalid address of the new token strategy.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should fail to update not existing strategy", async() => {
            let errorThrown = false;    
            let standard = await TokenStrategyMock2.getTokenStandard();
            try {
                await TokensFactory.updateTokenStrategy(invalidTokenStandard, TokensFactory.address, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Strategy not found.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should remove token strategy", async() => {
            let standard = await TokenStrategyMock2.getTokenStandard();
            let tx = await TokensFactory.removeTokenStrategy(standard, { from : token_owner });

            let topic = "0x4f51b575075efcaeb6bd9a33be406fec2d196ac6e3afa739a19e0f9051c884f6";
            // console.log(tx.receipt.logs[0].topics);
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Should fail to remove not exists strategy", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.removeTokenStrategy("0x00", { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Strategy not found.`.grey);
                assert(isException(error), error.toString());
            }
            assert.equal(errorThrown, true);
        });

        it("Should return the list of supported token standards", async() => {
            let standard = await CAT20Strategy.getTokenStandard();

            let standards = [];
            let length = await TFStorage.supportedStandardsLength();
            for (let i = 0; i < length; i++) {
                let item = await TFStorage.getStandardByIndex(i);
                standards.push(item);
            }

            assert.notEqual(standards.indexOf(standard), -1);
        });

        it("Should deploy a new token", async() => {
            let standard = await CAT20Strategy.getTokenStandard();

            let hexSymbol = web3.toHex(symbol);
            await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });

            tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
            let topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
            assert.notEqual(tx.receipt.logs[3].topics.indexOf(topic), -1);
            deployedTokenAddress = tx.receipt.logs[3].topics[1].replace("000000000000000000000000", "");

            assert.notEqual(
                deployedTokenAddress,
                zeroAddress,
                "New token was not deployed"
            );

            CAT20Token = await DSToken.at(deployedTokenAddress);
        });

        it("Should deploy one more token", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            
            let symbol2 = "TES";
            let hexSymbol = web3.toHex(symbol2);

            await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });

            let tx = await TokensFactory.createToken(name, symbol2, decimals, totalSupply, standard, { from : token_owner });

            let topic = "0xe38427d7596a29073b620ae861fdbd25e1b120ec4db69ea1e146489fe7416c9f";
            
            assert.notEqual(tx.receipt.logs[3].topics.indexOf(topic), -1);
            deployedTokenAddress = tx.receipt.logs[3].topics[1].replace("000000000000000000000000", "");

            assert.notEqual(
                deployedTokenAddress,
                zeroAddress,
                "Second token was not deployed"
            );
        });

        it("Should returns registered token standard", async() => {
            let standard = await CAT20Strategy.getTokenStandard();

            let result = await TokensFactory.getTokenStandard(CAT20Token.address, { from : token_owner });

            assert.equal(standard, result);
        });

        it("Should return 'true' for a supported standard", async() => {
            let standard = await CAT20Strategy.getTokenStandard();

            let result = await TokensFactory.isSupported(standard, { from : token_owner });

            assert.equal(true, result);
        });

        it("Should return 'false' for a not supported standard", async() => {
            let standard = web3.toHex("CAT-0x00");

            let result = await TokensFactory.isSupported(standard, { from : token_owner });

            assert.equal(false, result);
        });

        it("Should fail to create a new token with an empty name", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let errorThrown = false;
            try {
                await TokensFactory.createToken("", symbol, decimals, totalSupply, standard, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Name length should always greater 0.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should fail to create a new token with invalid token standard", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.createToken(name, symbol, decimals, totalSupply, "0x00", { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Token strategy not found.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should fail to create a new token with invalid total supply", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.createToken(name, symbol, decimals, 0, standard, { from : token_owner });
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Total supply should always greater 0.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should fail to create a new token with the already registered symbol", async() => {
            try {
                await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
            } catch (error) {
                console.log(`         tx revert -> Token with the same symbol is already registered.`.grey);
                assert(isException(error), error.toString());
            }
        });
    });

    // Test ERC-20 standard functions
    describe("Testing created CAT-20 token (ERC-20 standard functions)", async() => {
        it("Should return initial supply from balanceOf", async() => {
            let balance = await CAT20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance, totalSupply);
        });

        it("Should add accounts to the whitelist", async() => {
            let complianceRoleName = "Compliance";

            let tx = await permissionModule.addRoleForSpecificToken(token_owner, CAT20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
            let roleAddedTopic = "0x5a5a613a5ad7aa18ff1166bf1a95ae66ccb7233d352bc8afe49bde4ec724fab2";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(roleAddedTopic), -1);

            tx = await whiteList.addToWhiteList(token_owner, CAT20Token.address.valueOf(), { from: token_owner });
            let wlAddedTpic = "0x938c63ac3d228b23f6bee7618fefc6790522e338ac202c958a2ea9eb9706c5d1";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(wlAddedTpic), -1);

            tx = await whiteList.addToWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(wlAddedTpic), -1);

            tx = await whiteList.addToWhiteList(token_holder_2, CAT20Token.address.valueOf(), { from: token_owner });
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(wlAddedTpic), -1);
        })

        it("Should transfer tokens from the owner account to account " + token_holder_1, async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
        });
        
        it("Should approve " + web3.fromWei(toApprove, "ether") + symbol + " tokens for account " + token_holder_1, async() => {
            let tx = await CAT20Token.approve(token_holder_1, toApprove, {from: token_owner});

            assert.equal(tx.logs[0].args.owner, token_owner);
            assert.equal(tx.logs[0].args.spender, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toApprove);
        });

        it("Should transfer approved tokens", async() => {
            let tx = await CAT20Token.transferFrom(token_owner, token_holder_2, toApprove, {from: token_holder_1});

            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_2);
            assert.equal(tx.logs[1].args.value.toNumber(), toApprove);

            let balance = await CAT20Token.balanceOf(token_holder_2);
            
            assert.equal(balance.toNumber(), toApprove);
        });
    });

    describe("Tokens factory storage (methods allowed only for the tokens factory)", async() => {
        it("Should fail to emit an event that strategy was added", async() => {
            let errorThrown = false;
            try {
                await TFStorage.emitStrategyAdded(standard, accounts[0], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to emit an event that strategy was removed", async() => {
            let errorThrown = false;
            try {
                await TFStorage.emitStrategyRemoved(standard, accounts[0], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to emit an event that strategy was updated", async() => {
            let errorThrown = false;
            try {
                await TFStorage.emitStrategyUpdated(standard, accounts[0], accounts[1], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to emit event that token was created", async() => {
            let errorThrown = false;
            try {
                await TFStorage.emitCreatedToken(
                    accounts[0],
                    accounts[0],
                    "name",
                    "TEST",
                    "",
                    18,
                    100000,
                    standard, 
                    { from: accounts[0] }
                );
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to save new strategy", async() => {
            let errorThrown = false;
            try {
                await TFStorage.saveDeploymentStrategy(accounts[0], standard, 1, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to set issuer for the token", async() => {
            let errorThrown = false;
            try {
                await TFStorage.setIssuerForToken(accounts[0], accounts[0], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to set standard of the token", async() => {
            let errorThrown = false;
            try {
                await TFStorage.setTokenStandard(accounts[0], standard, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to add deployemnt strategy", async() => {
            let errorThrown = false;
            try {
                await TFStorage.addDeploymentStrategy(standard, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to update deployemnt strategy by index", async() => {
            let errorThrown = false;
            try {
                await TFStorage.updateStrategyByindex(standard, 0, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to update address of the deployment token strategy", async() => {
            let errorThrown = false;
            try {
                await TFStorage.updateStrategyAddress(standard, accounts[1], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to update index of the deployment token strategy", async() => {
            let errorThrown = false;
            try {
                await TFStorage.updateStrategyIndex(standard, 1, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to update length of the supported standards list", async() => {
            let errorThrown = false;
            try {
                await TFStorage.updateSupportedStandardsLength(1, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to remove standard from the standards list", async() => {
            let errorThrown = false;
            try {
                await TFStorage.removeStandard(0, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });

        it("Should fail to remove deployment strategy", async() => {
            let errorThrown = false;
            try {
                await TFStorage.removeDeploymentStrategy(standard, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the Tokens Factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!"); 
        });
    });

    describe("TFStorage public methods", async() => {
        it("Shuold return length of the supported standards list", async() => {
            let length = await TFStorage.supportedStandardsLength();

            assert.notEqual(parseInt(length), 0);
        });

        it("Should return standard by the standard index", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let returned = await TFStorage.getStandardByIndex(0);
            
            assert.equal(standard, returned);
        });

        it("Should get the index of the standard", async() => {
            let returned = await TFStorage.getStandardIndex(standard);

            assert.equal(returned, 0);
        });

        it("Should get address of the standard deployment strategy", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let returned = await TFStorage.getStandardAddress(standard);

            assert.notEqual(returned, zeroAddress);
        });

        it("Should get a token standard", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let tokenStandard = await TFStorage.getTokenStandard(deployedTokenAddress);
            
            assert.equal(standard, tokenStandard);
        });

        it("Should get issuer address", async() => {
            let issuer = await TFStorage.getIssuerAddress(deployedTokenAddress);

            assert.equal(issuer, accounts[0]);
        });
    });
});
