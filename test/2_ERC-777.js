// let TK = artifacts.require("./registry-layer/tokens-factory/tokens/ERC777/example/ERC777Token.sol");

// contract("ERC777", accounts => {
//     let token;
//     let name = "Test token";
//     let symbol = "TT";
//     let granularity = 1;
//     let operators = [accounts[0]];

//     before(async() => {
//         token = await TK.new(
//             name,
//             symbol,
//             granularity,
//             operators
//         );

//         assert.notEqual(
//             token.address.valueOf(),
//             "0x0000000000000000000000000000000000000000",
//             "Token was not deployed."
//         );
//     });

//     describe("Main functions", async() => {
//         it("Mint new tokens", async() => {
//             let amount = await web3.toWei(100);
//             let tx = await token.mint(accounts[0], amount, "");

//             assert.equal(tx.logs[1].args.to, accounts[0]);
//             assert.equal(tx.logs[1].args.tokens, amount);
//         });

//         it("Will transfer tokens", async() => {
//             let amount = await web3.toWei(1);

//             let tx = await token.transfer(accounts[1], amount, { from: accounts[0] });

//             assert.equal(tx.logs[1].args.to, accounts[1]);
//         });

//         it("Should add new operator", async() => {
//             let tx = await token.authorizeOperator(accounts[2]);

//             assert.equal(tx.logs[0].args.operator, accounts[2]);
//             assert.equal(tx.logs[0].args.tokenHolder, accounts[0]);
//         });

//         it("Operator will send tokens", async() => {
//             let amount = await web3.toWei(1);

//             let tx = await token.operatorSend(accounts[0], accounts[1], amount, "", "", { from: accounts[2] });

//             assert.equal(tx.logs[0].args.operator, accounts[2]);
//         });

//         it("Should remove operator", async() => {
//             let tx = await token.revokeOperator(accounts[2]);

//             assert.equal(tx.logs[0].args.operator, accounts[2]);
//             assert.equal(tx.logs[0].args.tokenHolder, accounts[0]);
//         });

//         it("Operator should fail to transfer tokens", async() => {
//             let throwError= false;
//             try {
//                 await token.operatorSend(accounts[0], accounts[1], amount, "", "", { from: accounts[2] });
//             } catch (error) {
//                 throwError = true;
//             }

//             assert.ok(throwError, "Transaction should fail!");
//         });
//     });
// });