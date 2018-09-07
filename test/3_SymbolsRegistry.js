const sleep = require('sleep');

var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");

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

contract('SymbolsRegistry', accounts => {
    let symbolRegistry;
    let permissionModule;
    let symbol = "TEST";
    let hexSymbol;
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

        let tx = await permissionModule.createRole(systemRoleName, ownerRoleName, {from: accounts[0]});

        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(ownerRoleName, bytes32ToString(tx.logs[0].args.parent));

        tx = await permissionModule.createRole(registrationRoleName, systemRoleName, {from: accounts[0]});

        assert.equal(registrationRoleName, bytes32ToString(tx.logs[0].args.name))
        assert.equal(systemRoleName, bytes32ToString(tx.logs[0].args.parent));

        let regSymbolId = createId("registerSymbol(bytes)");
        tx = await permissionModule.addMethodToTheRole(regSymbolId, registrationRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, regSymbolId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        let updateExpIntId = createId("updateExpirationInterval(uint256)");
        tx = await permissionModule.addMethodToTheRole(updateExpIntId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, updateExpIntId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], systemRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[0], registrationRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        tx = await permissionModule.addRoleToTheWallet(accounts[1], registrationRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[1]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), registrationRoleName);

        symbolRegistry = await SR.new(permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        hexSymbol = web3.toHex(symbol);
    });

    describe("Test symbols registry", async() => {
        it("ETH symbol is busy", async() => {
            let result = await symbolRegistry.symbolIsAvailable("ETH", { from: accounts[0] });
            assert.equal(result, false);
        });

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
            let errorThrown = false;
            try {
                let tokenAddress = "0x0dfcdef556ea71ef6cd957cc382cfc012539cf94";
                await symbolRegistry.registerTokenToTheSymbol(accounts[1], hexSymbol,tokenAddress);
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Allowed only for the tokens factory.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });
    });
});