const sleep = require('sleep');

var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var SLS20S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/SLS20Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/SLS20Token.sol");

var TM = artifacts.require("./request-verification-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-module/verification-service/WhiteList.sol");
var SLS20V = artifacts.require("./request-verification-layer/transfer-module/transfer-verification/SLS20Verification.sol");

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
    let whiteList;
    let transferModule;
    let SLS20Verification;
    let SLS20Strategy;
    let permissionModule;

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let txForRollback;

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

        let regSymbolId = createId("registerSymbol(bytes)");
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

        tx = await permissionModule.addRoleToTheWallet(accounts[0], complianceRoleName, { from: accounts[0] });
            
        assert.equal(tx.logs[0].args.wallet, accounts[0]);
        assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

        symbolRegistry = await SR.new(permissionModule.address.valueOf(), {from: accounts[0]});

        assert.notEqual(
            symbolRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SymbolRegistry contract was not deployed"
        );

        TokensFactory = await TF.new(symbolRegistry.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "TokensFactory contract was not deployed"
        );

        whiteList = await WL.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
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

        transferModule = await TM.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );


        let SLS20Strategy = await SLS20S.new();

        await SLS20Strategy.setTransferModule(transferModule.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "SLS20Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(SLS20Strategy.address, { from : token_owner });
        assert.equal(tx.logs[0].args.strategy, SLS20Strategy.address);

        let standard = await SLS20Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(SLS20Verification.address.valueOf(), standard);

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
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            SLS20Strategy: ${SLS20Strategy.address}
            SLS20Token: ${SLS20Token.address}
            WhiteList: ${whiteList.address}
            SLS20Vierification: ${SLS20Verification.address}
            TransferModule: ${transferModule.address}\n
        `);
    })

    describe("Testing SLS-20 token", async() => {
        it("Should add accounts to the whitelist", async() => {
            let complianceRoleName = "Compliance";

            let tx = await permissionModule.addRoleForSpecificToken(token_owner, SLS20Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
                
            assert.equal(tx.logs[0].args.wallet, token_owner);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

            tx = await whiteList.addToWhiteList(token_owner, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_owner);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_1, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_2, SLS20Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_2);
            assert.equal(tx.logs[0].args.tokenAddress, SLS20Token.address.valueOf());
        })

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