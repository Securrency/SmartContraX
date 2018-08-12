
var TF = artifacts.require("./TokensFactory.sol");
var SR = artifacts.require("./services/SymbolRegistry.sol");
var SLS20S = artifacts.require("./tokens-strategy/SLS20Strategy.sol");
var TSMock = artifacts.require("./mocks/TokenStrategyMock.sol");
var DSToken = artifacts.require("./tokens/SLS20Token.sol");

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
    let SLS20Token;

    let invalidTokenStandard = "ST-JGAqabJmEZsm1PXh3DmN";

    const txRevertNotification = "Transaction should fail!";
    let zeroAddress = "0x0000000000000000000000000000000000000000";

    before(async() => {
        symbolRegistry = await SR.new();

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        TokensFactory = await TF.new(symbolRegistry.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        SLS20Strategy = await SLS20S.new();

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "SLS20Strategy contract was not deployed"
        );

        TokenStrategyMock = await TSMock.new();

        assert.notEqual(
            TokenStrategyMock.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock contract was not deployed"
        );

        TokenStrategyMock2 = await TSMock.new();

        assert.notEqual(
            TokenStrategyMock2.address.valueOf(),
            zeroAddress,
            "TokenStrategyMock2 contract was not deployed"
        );

        // Printing all the contract addresses
        console.log(`
            Tokens factory core:\n
            TokensFactory: ${TokensFactory.address}
            SLS20Strategy: ${SLS20Strategy.address}
            TokenStrategyMock1:${TokenStrategyMock.address}
            TokenStrategyMock2:${TokenStrategyMock2.address}\n
        `);
    });

    describe("Test tokens factory", async() => {
        it("Should add new token strategy to the tokens factory", async() => {
            let tx = await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : token_owner });
            assert.equal(tx.logs[0].args.strategy, SLS20Strategy.address);
        });

        it ("Should fail to add existing token strategy", async() => {
            let errorThrown = false;
            try {
                await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : token_owner });
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
            let standard = await SLS20Strategy.getTokenStandard();

            let standards = await TokensFactory.getSupportedStandards();
            assert.equal(standards[0], standard);
        });

        it("Should deploy a new token", async() => {
            let standard = await SLS20Strategy.getTokenStandard();

            let hexSymbol = web3.toHex(symbol);
            await symbolRegistry.registerSymbol(hexSymbol, { from : token_owner });

            tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });

            deployedTokenAddress = tx.logs[0].args.tokenAddress;

            assert.notEqual(
                deployedTokenAddress,
                zeroAddress,
                "New token was not deployed"
            );

            assert.equal(tx.logs[0].args.name, name);
            assert.equal(tx.logs[0].args.symbol, symbol);

            SLS20Token = await DSToken.at(deployedTokenAddress);
        });

        it("Should deploy one more token", async() => {
            let standard = await SLS20Strategy.getTokenStandard();
            
            let symbol2 = "TES";
            let hexSymbol = web3.toHex(symbol2);

            await symbolRegistry.registerSymbol(hexSymbol, { from : token_owner });

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
            let standard = await SLS20Strategy.getTokenStandard();

            let result = await TokensFactory.getTokenStandard(SLS20Token.address, { from : token_owner });

            assert.equal(standard, result);
        });

        it("Should fail to create a new token with an empty name", async() => {
            let standard = await SLS20Strategy.getTokenStandard();
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
    describe("Testing created SLS-20 token (ERC-20 standard functions)", async() => {
        it("Should return initial supply from balanceOf", async() => {
            let balance = await SLS20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance, totalSupply);
        });

        it("Should transfer tokens from the owner account to account " + token_holder_1, async() => {
            let tx = await SLS20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
        });
        
        it("Should approve " + web3.fromWei(toApprove, "ether") + symbol + " tokens for account " + token_holder_1, async() => {
            let tx = await SLS20Token.approve(token_holder_1, toApprove, {from: token_owner});

            assert.equal(tx.logs[0].args.owner, token_owner);
            assert.equal(tx.logs[0].args.spender, token_holder_1);
            assert.equal(tx.logs[0].args.value.toNumber(), toApprove);
        });

        it("Should transfer approved tokens", async() => {
            let tx = await SLS20Token.transferFrom(token_owner, token_holder_2, toApprove, {from: token_holder_1});

            assert.equal(tx.logs[0].args.from, token_owner);
            assert.equal(tx.logs[0].args.to, token_holder_2);
            assert.equal(tx.logs[0].args.value.toNumber(), toApprove);

            let balance = await SLS20Token.balanceOf(token_holder_2);
            
            assert.equal(balance.toNumber(), toApprove);
        });
    });
});
