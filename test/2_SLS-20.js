const sleep = require('sleep');

var TF = artifacts.require("./TokensFactory.sol");
var SLS20S = artifacts.require("./tokens-strategy/SLS20Strategy.sol");
var DSToken = artifacts.require("./tokens/SLS20Token.sol");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract("SLS20Token", accounts => {
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

    let txForRollback;
    let txForCancellation;

    before(async() => {
        TokensFactory = await TF.new();

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        let SLS20Strategy = await SLS20S.new();

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "SLS20Strategy contract was not deployed"
        );
        
        let tx = await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : token_owner });
        assert.equal(tx.logs[0].args.strategy, SLS20Strategy.address);

        let standard = await SLS20Strategy.getTokenStandard();
            
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
            SLS20Token: ${SLS20Token.address}\n
        `);
    })

    describe("Testing SLS-20 token", async() => {
        it("Should transfer tokens from the owner account to account " + token_holder_1, async() => {
            let tx = await SLS20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);

            txForRollback = tx.tx;
        });

        it("Should transfer tokens from the owner account to account " + token_holder_2, async() => {
            let tx = await SLS20Token.transfer(token_holder_2, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_2);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);

            txForCancellation = tx.tx;
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = await SLS20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance + toTransfer * 2, totalSupply);
        });

        it("Should rollback transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForRollback);
            let checkpointId = parseInt(receipt.logs[0].topics[2]);
            
            await SLS20Token.createRollbackTransaction(token_holder_1, token_owner, toTransfer, checkpointId, txForRollback);

            let status = await SLS20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });

        it("Should cancel transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForCancellation);
            let checkpointId = parseInt(receipt.logs[0].topics[2]);

            await SLS20Token.createCancellationTransaction(token_holder_2, token_owner, toTransfer, checkpointId, txForCancellation);

            let status = await SLS20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });

        it("Should get correct ballance after rollback and transaction cancellation", async() => {
            let balance = await SLS20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance, totalSupply);
        });
    });

    describe("Transactions checkpoints", async() => {
        it("Should change checkpoint expiration time", async() => {
            let newExpirationTime = 1;
            let expirationTime = await SLS20Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await SLS20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await SLS20Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);
        });

        it("Should fial to create rollback transaction, checkpoint is expired", async() => {
            let tx = await SLS20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            sleep.msleep(1001);

            let errorThrown = false;
            try {
                await SLS20Token.createRollbackTransaction(token_holder_1, token_owner, toTransfer, checkpointId, tx.tx);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Checkpoint is already used or expired.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update checkpoint expiration time and create rollback transaction", async() => {
            let newExpirationTime = 600;
            let expirationTime = await SLS20Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await SLS20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await SLS20Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);

            let tx = await SLS20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            await SLS20Token.createRollbackTransaction(token_holder_1, token_owner, toTransfer, checkpointId, tx.tx);

            let status = await SLS20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });
});