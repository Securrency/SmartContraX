var TM = artifacts.require("./request-verification-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-module/verification-service/WhiteList.sol");
var SLS20V = artifacts.require("./request-verification-layer/transfer-module/transfer-verification/SLS20Verification.sol");

var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SLS20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/SLS20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/SLS20Token.sol");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

const txRevertNotification = "Transaction should fail!";

contract('TransferModule', accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = web3.toWei(10000, "ether");

    const toTransfer = web3.toWei(10, "ether");

    let SLS20Token;
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    let whiteList;
    let transferModule;
    let SLS20Verification;
    let SLS20Strategy;

    before(async() => {
        symbolRegistry = await SR.new();

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        TokensFactory = await TF.new(symbolRegistry.address.valueOf(), { from: token_owner });

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        whiteList = await WL.new(TokensFactory.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "WhiteList contract was not deployed"
        );

        SLS20Verification = await SLS20V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "SLS20Vierification contract was not deployed"
        );

        transferModule = await TM.new(TokensFactory.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );

        SLS20Strategy = await SLS20S.new();

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "SLS20Strategy contract was not deployed"
        );

        let tx = await SLS20Strategy.setTransferModule(transferModule.address.valueOf());
        
        tx = await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : token_owner });
        assert.equal(tx.logs[0].args.strategy, SLS20Strategy.address);

        let standard = await SLS20Strategy.getTokenStandard();

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });

        assert.notEqual(
            tx.logs[0].args.tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        assert.equal(tx.logs[0].args.name, name);
        assert.equal(tx.logs[0].args.symbol, symbol);

        SLS20Token = await DSToken.at(tx.logs[0].args.tokenAddress);



        // Printing all the contract addresses
        console.log(`
            Tokens factory core:\n
            TokensFactory: ${TokensFactory.address}
            SLS20Strategy: ${SLS20Strategy.address}
            SLS20Token: ${SLS20Token.address}
            WhiteList: ${whiteList.address}
            SLS20Vierification: ${SLS20Verification.address}
            TransferModule: ${transferModule.address}\n
        `);
    });

    describe("Test transfer module", async() => {
        it("Should add SLS20Verification to transfer module", async() => {
            let standard = await SLS20Strategy.getTokenStandard();
            let tx = await transferModule.addVerificationLogic(SLS20Verification.address.valueOf(), standard);

            assert.equal(tx.logs[0].args.standard, standard);
            assert.equal(tx.logs[0].args.tvAddress, SLS20Verification.address.valueOf());
        });

        it("Should add account to the whitelist", async() => {
            let tx = await whiteList.addToWhiteList(token_holder_1, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_owner, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_owner);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());
        });
        
        it("Should returns 'true' in the SLS20Verification", async() => {
            let tx = await SLS20Verification.verifyTransfer(
                token_owner,
                token_holder_1, 
                token_owner, 
                SLS20Token.address.valueOf(), 
                toTransfer,
                { from: token_owner }
            );

            assert.equal(tx, true);
        });

        it("Should returns 'false' in the SLS20Verification", async() => {
            let tx = await SLS20Verification.verifyTransfer(
                token_owner,
                token_holder_2, 
                token_owner, 
                SLS20Token.address.valueOf(), 
                toTransfer,
                { from: token_owner }
            );

            assert.equal(tx, false);
        });

        it("Should be transferred tokens on the account which is in the whitelist", async() => {
            let tx = await SLS20Token.transfer(token_holder_1, toTransfer);

            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
        });

        it("Should be failed to transfer on account that is not in whitelist", async() => {
            let errorThrown = false;
            try {
                await SLS20Token.transfer(token_holder_2, toTransfer);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Account is not in whitelist.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, txRevertNotification);
        });

        it("Should add the previous account to the whitelist and successfully transfer", async() => {
            let tx = await whiteList.addToWhiteList(token_holder_2, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_2);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());
            
            tx = await SLS20Token.transfer(token_holder_2, toTransfer);

            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_2);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
        });
    });
});