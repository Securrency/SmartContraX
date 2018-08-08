const sleep = require('sleep');

var SR = artifacts.require("./services/SymbolRegistry.sol");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

contract('SymbolsRegistry', accounts => {
    let symbolRegistry;
    let symbol = "TEST";
    let hexSymbol;
    before(async() => {
        symbolRegistry = await SR.new();

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        hexSymbol = web3.toHex(symbol);
    });

    describe("Test symbols registry", async() => {
        it("Should register new symbol", async() => {
            let tx = await symbolRegistry.registerSymbol(hexSymbol, { from : accounts[0] });
            assert.equal(tx.logs[0].args.symbol, hexSymbol);
            assert.equal(tx.logs[0].args.owner, accounts[0]);
        });

        it("Should get symbol expire date", async() => {
            let expireDate = await symbolRegistry.getSymbolExpireDate(hexSymbol, { from: accounts[0] });
            assert.notEqual(expireDate, 0);
        });

        it("Should renew symbol", async() => {
            let expireDateOld = await symbolRegistry.getSymbolExpireDate(hexSymbol, { from: accounts[0] });

            let tx = await symbolRegistry.renewSymbol(hexSymbol, { from: accounts[0] });
            assert.equal(tx.logs[0].args.symbol, hexSymbol);

            let expireDateNew = await symbolRegistry.getSymbolExpireDate(hexSymbol, { from: accounts[0] });
            assert.notEqual(expireDateOld, expireDateNew);
        });

        it("Should fail to renew symbol form, not owner account", async() => {
            let errorThrown = false;
            try {
                await symbolRegistry.renewSymbol(hexSymbol, { from: accounts[1] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for an owner.`.grey);
                assert(isException(error), error.toString());;
            }

            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should successful transfer symbol ownership", async() => {
            let tx = await symbolRegistry.transferOwnership(hexSymbol, accounts[1], { from: accounts[0] });
            
            assert.equal(tx.logs[0].args.oldOwner, accounts[0]);
            assert.equal(tx.logs[0].args.newOwner, accounts[1]);

            let isOwner = await symbolRegistry.isSymbolOwner(hexSymbol, accounts[1]);
            assert.equal(isOwner, true);
        });

        it("Should update symbols expiration interval", async() => {
            let newInterval = 1;
            let tx = await symbolRegistry.updateExpirationInterval(newInterval, { from: accounts[0] });

            assert.equal(newInterval, tx.logs[0].args.interval.valueOf());
        });

        it("Should register already an expired symbol", async() => {
            let symbol2 = "TEST2";
            let hexSymbol2 = web3.toHex(symbol2);
            let tx = await symbolRegistry.registerSymbol(hexSymbol2, { from: accounts[0] });
            assert.equal(tx.logs[0].args.symbol, hexSymbol2);
            assert.equal(tx.logs[0].args.owner, accounts[0]);

            sleep.sleep(2);

            tx = await symbolRegistry.registerSymbol(hexSymbol2, { from: accounts[1] });
            assert.equal(tx.logs[0].args.symbol, hexSymbol2);
            assert.equal(tx.logs[0].args.owner, accounts[1]);

            let isOwner = await symbolRegistry.isSymbolOwner(hexSymbol2, accounts[1]);
            assert.equal(isOwner, true);
        });

        it("Should register token to the symbol", async() => {
            let tokenAddress = "0x0dfcdef556ea71ef6cd957cc382cfc012539cf94";
            let tx = await symbolRegistry.registerTokenToTheSymbol(accounts[1], hexSymbol,tokenAddress);
            
            assert.equal(tx.logs[0].args.tokenAddress, tokenAddress);
            assert.equal(tx.logs[0].args.symbol, hexSymbol);
        });
    });
});