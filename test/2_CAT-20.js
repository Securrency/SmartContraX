const sleep = require('sleep');

var CR = artifacts.require("./registry-layer/components-registry/ComponentsRegistry.sol");
var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
let ES = artifacts.require("./registry-layer/symbol-registry/eternal-storages/SRStorage.sol");
var CAT20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT20Strategy.sol");
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

contract("CAT20Token", accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = web3.toWei(10000, "ether");

    const toTransfer = web3.toWei(10, "ether");

    let CAT20Token;
    let whiteList;
    let transferModule;
    let CAT20Verification;
    let CAT20Strategy;
    let permissionModule;
    let componentsRegistry;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let txForRollback;

    before(async() => {
        componentsRegistry = await CR.new();
        assert.notEqual(
            componentsRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "Components Registry contract was not deployed"
        );

        permissionModule = await PM.new(componentsRegistry.address.valueOf());

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

        let addStrategyId = createId("addTokenStrategy(address)");
        tx = await permissionModule.addMethodToTheRole(addStrategyId, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addStrategyId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let addVL = createId("addVerificationLogic(address,bytes32)");
        tx = await permissionModule.addMethodToTheRole(addVL, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addVL);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let createTokenId = createId("createToken(string,string,uint8,uint256,bytes32)");
        tx = await permissionModule.addMethodToTheRole(createTokenId, issuerRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, createTokenId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), issuerRoleName);
        
        let setTM = createId("setTransferModule(address)");
        tx = await permissionModule.addMethodToTheRole(setTM, systemRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, setTM);
        assert.equal(bytes32ToString(tx.logs[0].args.role), systemRoleName);

        let addToWLId = createId("addToWhiteList(address,address)");
        tx = await permissionModule.addMethodToTheRole(addToWLId, complianceRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, addToWLId);
        assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

        let rollbackId = createId("createRollbackTransaction(address,address,address,uint256,uint256,string)");
        tx = await permissionModule.addMethodToTheRole(rollbackId, complianceRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, rollbackId);
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

        tx = await permissionModule.addRoleToTheWallet(accounts[0], complianceRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

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

        tx = componentsRegistry.registerNewComponent(symbolRegistry.address.valueOf());

        TokensFactory = await TF.new(componentsRegistry.address.valueOf(), {from: accounts[0]});

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

        transferModule = await TM.new(componentsRegistry.address.valueOf(), { from: token_owner });
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
        assert.equal(tx.logs[0].args.strategy, CAT20Strategy.address);

        let standard = await CAT20Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT20Verification.address.valueOf(), standard);

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        let tokenAddress = tx.logs[0].args.tokenAddress;

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT20Token = await DSToken.at(tokenAddress);

        // Printing all the contract addresses
        console.log(`
            Core smart contracts:\n
            ComponentsRegistry: ${componentsRegistry.address}
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            CAT20Strategy: ${CAT20Strategy.address}
            CAT20Token: ${CAT20Token.address}
            WhiteList: ${whiteList.address}
            CAT20Vierification: ${CAT20Verification.address}
            TransferModule: ${transferModule.address}\n
        `);
    })

    describe("Testing CAT-20 token", async() => {
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

            txForRollback = tx.tx;
        });

        it("Should transfer tokens from the owner account to account " + token_holder_2, async() => {
            let tx = await CAT20Token.transfer(token_holder_2, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_2);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = await CAT20Token.balanceOf(token_owner);
            balance = balance.toNumber();

            assert.equal(balance + toTransfer * 2, totalSupply);
        });

        it("Should rollback transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForRollback);
            let transaction = web3.eth.getTransaction(txForRollback);

            let checkpointId = parseInt(receipt.logs[0].topics[2]);
            
            await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, transaction["from"], toTransfer, checkpointId, txForRollback);

            let status = await CAT20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });

    describe("Transactions checkpoints", async() => {
        it("Should change checkpoint expiration time", async() => {
            let newExpirationTime = 1;
            let expirationTime = await CAT20Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT20Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);
        });

        it("Should fial to create rollback transaction, checkpoint is expired", async() => {
            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            sleep.msleep(1001);

            let errorThrown = false;
            try {
                await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, token_holder_1, toTransfer, checkpointId, tx.tx);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Checkpoint is already used or expired.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update checkpoint expiration time and create rollback transaction", async() => {
            let newExpirationTime = 600;
            let expirationTime = await CAT20Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT20Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT20Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);

            let tx = await CAT20Token.transfer(token_holder_1, toTransfer, {from: token_owner});
            
            assert.equal(tx.logs[1].args.from, token_owner);
            assert.equal(tx.logs[1].args.to, token_holder_1);
            assert.equal(tx.logs[1].args.value.toNumber(), toTransfer);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            await CAT20Token.createRollbackTransaction(token_holder_1, token_owner, token_owner, toTransfer, checkpointId, tx.tx);

            let status = await CAT20Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });
});