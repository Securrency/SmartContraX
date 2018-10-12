const sleep = require('sleep');

let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
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
    let componentsRegistry;
    let SRStorage;
    let symbol = "TEST";
    let testIssuerName = "Issuer name";
    let newIssuerName = "new Issuer name";
    let hexSymbol;
    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components Registry contract was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf(), {from: accounts[0]});

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

        let regSymbolId = createId("registerSymbol(bytes,bytes)");
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

        tx = componentsRegistry.initializePermissionModule(permissionModule.address.valueOf());
        
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

        hexSymbol = web3.toHex(symbol);

        tx = componentsRegistry.registerNewComponent(symbolRegistry.address.valueOf());
    });

    describe("Test symbols registry", async() => {
        it("ETH symbol is busy", async() => {
            let result = await symbolRegistry.symbolIsAvailable("ETH", { from: accounts[0] });
            assert.equal(result, false);
        });

        it("Should register new symbol", async() => {
            let tx = await symbolRegistry.registerSymbol(hexSymbol, testIssuerName, { from : accounts[0] });
            
            let topic = "0x5ade0af46527cf760337ecd4622da8babca0e6f5b11bb91ab3ba2b73eaaa9ffa";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Should get symbol expire date", async() => {
            let expireDate = await symbolRegistry.getSymbolExpireDate(hexSymbol, { from: accounts[0] });
            assert.notEqual(expireDate, 0);
        });

        it("Should renew symbol", async() => {
            let expireDateOld = await symbolRegistry.getSymbolExpireDate(hexSymbol, { from: accounts[0] });

            let tx = await symbolRegistry.renewSymbol(hexSymbol, { from: accounts[0] });
            let topic = "0x407b057f9f9b7d84fd07a19ad2acde81009e64366e22ced2fe87ed80fbfb34c0";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

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
            let tx = await symbolRegistry.transferOwnership(hexSymbol, accounts[1], newIssuerName, { from: accounts[0] });

            let topic = "0x38f7ca9ae00747ca9704a1e9296eb432e0d56c4d9372224ce5c9e298f6874ec5";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

            let isOwner = await symbolRegistry.isSymbolOwner(hexSymbol, accounts[1]);
            assert.equal(isOwner, true);
        });

        it("Should update symbols expiration interval", async() => {
            let newInterval = 1;
            let tx = await symbolRegistry.updateExpirationInterval(newInterval, { from: accounts[0] });

            let topic = "0x34bf8d0f1668b5be5308a1c4acb3e2586421b1c162dc75e321c917e04ae58f01";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
        });

        it("Should register already an expired symbol", async() => {
            let symbol2 = "TEST2";
            let hexSymbol2 = web3.toHex(symbol2);
            let tx = await symbolRegistry.registerSymbol(hexSymbol2, "", { from: accounts[0] });

            let topic = "0x5ade0af46527cf760337ecd4622da8babca0e6f5b11bb91ab3ba2b73eaaa9ffa";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);
            
            sleep.sleep(2);

            tx = await symbolRegistry.registerSymbol(hexSymbol2, "", { from: accounts[1] });
            topic = "0x5ade0af46527cf760337ecd4622da8babca0e6f5b11bb91ab3ba2b73eaaa9ffa";
            assert.notEqual(tx.receipt.logs[0].topics.indexOf(topic), -1);

            let isOwner = await symbolRegistry.isSymbolOwner(hexSymbol2, accounts[1]);
            assert.equal(isOwner, true);
        });

        it("Should fail to register token to the symbol", async() => {
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

    describe("Symbol registry storage (methods allowed only for the symbol registry)", async() => {
        it("Should fail register new symbol", async() => {
            let errorThrown = false;
            let time = new Date().getTime();
            try {
                await SRStorage.saveSymbol(
                    hexSymbol, 
                    accounts[0],
                    "0x0000000000000000000000000000000000000000",
                    "",
                    time,
                    time,
                    { from : accounts[0] }
                );
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should fail update symbol owner", async() => {
            let errorThrown = false;
            try {
                await SRStorage.udpateSymbolOwner(hexSymbol, accounts[0], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });

        it("Should fail update symbol token", async() => {
            let errorThrown = false;
            try {
                await SRStorage.updateSymbolToken(hexSymbol, accounts[0], { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });

        it("Should fail update symbol token", async() => {
            let errorThrown = false;
            try {
                await SRStorage.updateSymbolIssuerName(hexSymbol, "issuer name", { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });

        it("Should fail update symbol registration date", async() => {
            let errorThrown = false;
            let time = new Date().getTime();
            try {
                await SRStorage.updateSymbolRegistration(hexSymbol, time, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });

        it("Should fail update symbol epiration time", async() => {
            let errorThrown = false;
            let time = new Date().getTime();
            try {
                await SRStorage.updateSymbolExpiration(hexSymbol, time, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });

        it("Should fail update epiration interval", async() => {
            let errorThrown = false;
            let time = new Date().getTime();
            try {
                await SRStorage.updateExpirationInterval(time, { from: accounts[0] });
            } catch (error) {
                errorThrown = true
                console.log(`         tx revert -> Method allowed only for the Symbol Registry.`.grey);
                assert(isException(error), error.toString());;
            }
            assert.ok(errorThrown, "Transaction should fail!");            
        });
    });

    describe("SRStorage public methods", async() => {
        it("Should return symbol owner", async() => {
            let owner = await SRStorage.getSymbolOwner(hexSymbol, { from: accounts[0] });

            assert.equal(owner, accounts[1]);
        });

        it("Should get symbol token", async() => {
            let token = await SRStorage.getSymbolToken(hexSymbol, { from: accounts[0] });
            assert.equal(token, "0x0000000000000000000000000000000000000000");
        });

        it("Should return issuer name", async() => {
            let issuerName = await SRStorage.getSymbolIssuerName(hexSymbol, { from: accounts[0] });
            assert.equal(issuerName, web3.toHex(newIssuerName));
        });

        it("Should return symbol registration time", async() => {
            let time = await SRStorage.getSymbolRegistration(hexSymbol, { from: accounts[0] });
            assert.notEqual(time, 0);
        });

        it("Should return symbol expiration time", async() => {
            let time = await SRStorage.getSymbolExpiration(hexSymbol, { from: accounts[0] });
            assert.notEqual(time, 0);
        });

        it("Should return symbols expiration interval", async() => {
            let time = await SRStorage.getExpirationInterval({ from: accounts[0] });
            assert.notEqual(time, 0);
        });
    });
});