const sleep = require('sleep');

var TF = artifacts.require("./registry-layer/tokens-factory/TokensFactory.sol");
var SR = artifacts.require("./registry-layer/symbol-registry/SymbolRegistry.sol");
var CAT721S = artifacts.require("./registry-layer/tokens-factory/deployment-strategies/CAT721Strategy.sol");
var DSToken = artifacts.require("./registry-layer/tokens-factory/tokens/CAT721Token.sol");

var TM = artifacts.require("./request-verification-layer/transfer-module/TransferModule.sol");
var WL = artifacts.require("./request-verification-layer/transfer-module/verification-service/WhiteList.sol");
var CAT721V = artifacts.require("./request-verification-layer/transfer-module/transfer-verification/CAT721Verification.sol");

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

contract("CAT721Token", accounts => {
    const token_owner = accounts[0];
    const token_holder_1 = accounts[1];
    const token_holder_2 = accounts[2];

    // Token details
    const name = "Securities Token";
    const symbol = "SEC";
    const decimals = 18;
    const totalSupply = 0;

    const tokenId = 1;

    let CAT721Token;
    let whiteList;
    let transferModule;
    let CAT721Verification;
    let CAT721Strategy;
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

        let mintId = createId("mint(address,uint256)");
        tx = await permissionModule.addMethodToTheRole(mintId, complianceRoleName, { from: accounts[0] });

        assert.equal(tx.logs[0].args.methodId, mintId);
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

        await permissionModule.setTokensFactory(TokensFactory.address.valueOf());
        await symbolRegistry.setTokensFactory(TokensFactory.address.valueOf());

        whiteList = await WL.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "WhiteList contract was not deployed"
        );

        CAT721Verification = await CAT721V.new(whiteList.address.valueOf(), { from: token_owner });
        assert.notEqual(
            whiteList.address.valueOf(),
            zeroAddress,
            "CAT721Vierification contract was not deployed"
        );

        transferModule = await TM.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf(), { from: token_owner });
        assert.notEqual(
            transferModule.address.valueOf(),
            zeroAddress,
            "TransferModule contract was not deployed"
        );


        let CAT721Strategy = await CAT721S.new(TokensFactory.address.valueOf(), permissionModule.address.valueOf());

        await CAT721Strategy.setTransferModule(transferModule.address.valueOf());

        assert.notEqual(
            TokensFactory.address.valueOf(),
            zeroAddress,
            "CAT721Strategy contract was not deployed"
        );
        
        tx = await TokensFactory.addTokenStrategy(CAT721Strategy.address, { from : token_owner });
        assert.equal(tx.logs[0].args.strategy, CAT721Strategy.address);

        let standard = await CAT721Strategy.getTokenStandard();

        await transferModule.addVerificationLogic(CAT721Verification.address.valueOf(), standard);

        let hexSymbol = web3.toHex(symbol);
        await symbolRegistry.registerSymbol(hexSymbol, "", { from : token_owner });
            
        tx = await TokensFactory.createToken(name, symbol, decimals, totalSupply, standard, { from : token_owner });
        let tokenAddress = tx.logs[0].args.tokenAddress;

        assert.notEqual(
            tokenAddress,
            zeroAddress,
            "New token was not deployed"
        );

        CAT721Token = await DSToken.at(tokenAddress);

        // Printing all the contract addresses
        console.log(`
            Tokens factory core:\n
            PermissionModule: ${permissionModule.address}
            TokensFactory: ${TokensFactory.address}
            CAT721Strategy: ${CAT721Strategy.address}
            CAT721Token: ${CAT721Token.address}
            WhiteList: ${whiteList.address}
            CAT721Vierification: ${CAT721Verification.address}
            TransferModule: ${transferModule.address}\n
        `);
    })

    describe("Testing CAT-721 token", async() => {
        it("Should add accounts to the whitelist", async() => {
            let complianceRoleName = "Compliance";

            let tx = await permissionModule.addRoleForSpecificToken(token_owner, CAT721Token.address.valueOf(), complianceRoleName, { from: accounts[0] });
                
            assert.equal(tx.logs[0].args.wallet, token_owner);
            assert.equal(bytes32ToString(tx.logs[0].args.role), complianceRoleName);

            tx = await whiteList.addToWhiteList(token_owner, CAT721Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_owner);
            assert.equal(tx.logs[0].args.tokenAddress, CAT721Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_1, CAT721Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_1);
            assert.equal(tx.logs[0].args.tokenAddress, CAT721Token.address.valueOf());

            tx = await whiteList.addToWhiteList(token_holder_2, CAT721Token.address.valueOf(), { from: token_owner });

            assert.equal(tx.logs[0].args.who, token_holder_2);
            assert.equal(tx.logs[0].args.tokenAddress, CAT721Token.address.valueOf());
        });

        it("Should mint token", async() => {
            let tx = await CAT721Token.mint(token_holder_1, tokenId);

            assert.equal(tx.logs[0].args._to, token_holder_1);
            assert.equal(tx.logs[0].args._tokenId, tokenId);
        });

        it("Should fail mint token with the same token id", async() => {
            let errorThrown = false;
            try {
                await CAT721Token.mint(token_holder_1, tokenId);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Token id is busy.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should transfer tokens", async() => {
            let tx = await CAT721Token.transferFrom(token_holder_1, token_holder_2, tokenId, {from: token_holder_1});

            assert.equal(tx.logs[1].args._from, token_holder_1);
            assert.equal(tx.logs[1].args._to, token_holder_2);
            assert.equal(tx.logs[1].args._tokenId, tokenId);

            txForRollback = tx.tx;
        });

        it("Should get correct ballance after previous transfers", async() => {
            let balance = await CAT721Token.balanceOf(token_holder_1);

            assert.equal(balance.toNumber(), 0);

            balance = await CAT721Token.balanceOf(token_holder_2);

            assert.equal(balance.toNumber(), 1);
        });

        it("Should rollback transaction", async() => {
            let receipt = web3.eth.getTransactionReceipt(txForRollback);
            let transaction = web3.eth.getTransaction(txForRollback);

            let checkpointId = parseInt(receipt.logs[0].topics[2]);
            
            await CAT721Token.createRollbackTransaction(token_holder_2, token_holder_1, transaction["from"], tokenId, checkpointId, txForRollback);

            let status = await CAT721Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });

    describe("Transactions checkpoints", async() => {
        it("Should change checkpoint expiration time", async() => {
            let newExpirationTime = 1;
            let expirationTime = await CAT721Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT721Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT721Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);
        });

        it("Should fial to create rollback transaction, checkpoint is expired", async() => {
            let tx = await CAT721Token.transferFrom(token_holder_1, token_holder_2, tokenId, {from: token_holder_1});
            
            assert.equal(tx.logs[1].args._from, token_holder_1);
            assert.equal(tx.logs[1].args._to, token_holder_2);
            assert.equal(tx.logs[1].args._tokenId, tokenId);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            sleep.msleep(1001);

            let errorThrown = false;
            try {
                await CAT721Token.createRollbackTransaction(token_holder_2, token_holder_1, token_holder_1, tokenId, checkpointId, txForRollback);
            } catch (error) {
                errorThrown = true;
                console.log(`         tx revert -> Checkpoint is already used or expired.`.grey);
                assert(isException(error), error.toString());
            }
            assert.ok(errorThrown, "Transaction should fail!");
        });

        it("Should update checkpoint expiration time and create rollback transaction", async() => {
            let newExpirationTime = 600;
            let expirationTime = await CAT721Token.expireInterval();
            expirationTime = expirationTime.toNumber();

            await CAT721Token.updateExpirationTime(newExpirationTime);
            let updatedTime = await CAT721Token.expireInterval();
            updatedTime = updatedTime.toNumber();
            
            assert.equal(updatedTime, newExpirationTime);

            let tx = await CAT721Token.transferFrom(token_holder_2, token_holder_1, tokenId, {from: token_holder_2});
            
            assert.equal(tx.logs[1].args._from, token_holder_2);
            assert.equal(tx.logs[1].args._to, token_holder_1);
            assert.equal(tx.logs[1].args._tokenId, tokenId);
            
            let checkpointId = tx.logs[0].args.checkpointId.toNumber();

            await CAT721Token.createRollbackTransaction(token_holder_1, token_holder_2, token_holder_2, tokenId, checkpointId, txForRollback);

            let status = await CAT721Token.isActiveCheckpoint(checkpointId);
            assert.ok(!status, "Checkpoint not activated!");
        });
    });
});