
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
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

    let invalidTokenStandard = "ST-JGAqabJmEZsm1PXh3DmN";

    const txRevertNotification = "Transaction should fail!";
    let zeroAddress = "0x0000000000000000000000000000000000000000";

    before(async() => {
        permissionModule = await PM.new();

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

        let tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});

        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});

        assert.equal(registrationRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(issuerRoleName, systemRoleName, {from: accounts[0]});

        assert.equal(issuerRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(complianceRoleName, issuerRoleName, {from: accounts[0]});

        assert.equal(complianceRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(issuerRoleName, bytes32ToString(tx.logs[0].args.parent));

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, regSymbolId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, createTokenId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addStrategyId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let removeStrategyId = createId("removeTokenStrategy(bytes32)");
        tx = await permissionModule.addMethodToTheRole(removeStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, removeStrategyId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let updateStrategyId = createId("updateTokenStrategy(bytes32,address)");
        tx = await permissionModule.addMethodToTheRole(updateStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, updateStrategyId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, setTM);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });
        
        assert.equal(tx.logs[0].args.methodId, addVL);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);


        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addToWLId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], issuerRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);

        symbolRegistry = await SR.new(permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        TokensFactory = await TF.new(symbolRegistry.address.valueOf(), permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        await permissionModule.setTokensFactory(TokensFactory.address.valueOf());
        await symbolRegistry.setTokensFactory(TokensFactory.address.valueOf());

        whiteList = await WL.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
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

        transferModule = await TM.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );

        CAT20Strategy = await CAT20S.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT20Strategy contract was not deployed"
        );

        await CAT20Strategy.setTransferModule(transferModule.address.valueOf());

        TokenStrategyMock = await TSMock.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf());

        assert.notEqual(
            TokenStrategyMock.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock contract was not deployed"
        );

        TokenStrategyMock2 = await TSMock.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf());

        assert.notEqual(
            TokenStrategyMock2.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock2 contract was not deployed"
        );

        // Printing all the contract addresses
        console.log(`
            Tokens factory core:\n
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            CAT20Strategy: ${CAT20Strategy.address}
            TokenStrategyMock1:${TokenStrategyMock.address}
            TokenStrategyMock2:${TokenStrategyMock2.address}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}\n
        `);
    });

    describe("Test tokens factory", async() => {
        it("Should add new token strategy to the tokens factory", async() => {
            let tx = await TokensFactory.addTokenStrategy(CAT20Strategy.address, { from : token_owner });
            assert.equal(tx.logs[0].args.strategy, CAT20Strategy.address);
        });

        it("Should add CAT20Verification to transfer module", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            let tx = await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);

            assert.equal(tx.logs[0].args.standard, standard);
            assert.equal(tx.logs[0].args.tvAddress, CAT20Verification.address.valueOf());
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
            assert.equal(tx.logs[0].args.strategy, TokenStrategyMock.address);

            standard = await TokenStrategyMock.getTokenStandard();

            tx = await TokensFactory.updateTokenStrategy(standard, TokenStrategyMock2.address, { from : token_owner });
            assert.equal(tx.logs[0].args.newStrategy, TokenStrategyMock2.address);
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
            assert.equal(tx.logs[0].args.strategy, TokenStrategyMock2.address);
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

            let standards = await TokensFactory.getSupportedStandards();
            assert.equal(standards[0], standard);
        });

        it("Should deploy a new token", async() => {
            let standard = await CAT20Strategy.getTokenStandard();

            let hexSymbol = web3.toHex(symbol);
            await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });

            tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });

            deployedTokenAddress = tx.logs[0].args.tokenAddress;

            assert.notEqual(
                deployedTokenAddress,
                zeroAddress,
                "New token was not deployed"
            );

            assert.equal(tx.logs[0].args.name, name);
            assert.equal(tx.logs[0].args.symbol, symbol);

            CAT20Token = await DSToken.at(deployedTokenAddress);
        });

        it("Should deploy one more token", async() => {
            let standard = await CAT20Strategy.getTokenStandard();
            
            let symbol2 = "TES";
            let hexSymbol = web3.toHex(symbol2);

            await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });

            let tx = await TokensFactory.createToken(name, symbol2, decimals, totalSupply, standard, { from : token_owner });

            assert.notEqual(
                deployedTokenAddress,
                zeroAddress,
                "Second token was not deployed"
            );

            assert.equal(tx.logs[0].args.name, name);
            assert.equal(tx.logs[0].args.symbol, symbol2);
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
                
            assert.equal(tx.logs[0].args.wallet, token_owner);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

            tx = await whiteList.addToWhiteList(token_owner, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_owner);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_1, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_2, CAT20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_2);
            assert.equal(tx.logs[0].args.tokenAddress, CAT20Token.address.valueOf());
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
});
