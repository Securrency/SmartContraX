
const Web3 = require('web3');
var readlineSync = require('readline-sync');
var web3Helper = require('./helpers/web3Helper.js');

let tokensFactoryAddress = "0x0";

try {
    tokensFactoryABI = JSON.parse(require('fs').readFileSync('./build/contracts/TokensFactory.json').toString()).abi;
} catch(err) {
    console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that tokens factory is compiled and deployed.");
    return;
}

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let tokensFactory;

function setup(networkId) {
    try {
        tokensFactoryAddress = JSON.parse(require('fs').readFileSync('./build/contracts/TokensFactory.json').toString()).networks[networkId].address;
        tokensFactory = new web3.eth.Contract(tokensFactoryABI,tokensFactoryAddress);
        tokensFactory.setProvider(web3.currentProvider);
    } catch (err) {
        console.log(err)
        console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
        console.log('Network id: ', networkId);
        return false;
    }

    return true;
}

async function run() {
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");

    let networkId = await web3.eth.net.getId();

    if (!setup(networkId)) {
        return;
    }

    accounts = await web3.eth.getAccounts();
    issuer = accounts[0];

    // take details
    console.log("Please fill token details");

    let tokenName =  readlineSync.question('Enter token name: ');
    if (tokenName == "") tokenName = 'Default token name';

    let tokenSymbol =  readlineSync.question('Enter token symbol: ');
    if (tokenSymbol == "") tokenSymbol = 'DEF';

    let totalSupply =  readlineSync.question('Enter token total supply: ');
    if (totalSupply == "") totalSupply = 100;

    let tokenStandard =  readlineSync.question('Token standard: ');
    if (tokenStandard == "") tokenStandard = "ST-20";

    decimals = 18;

    let confirm =  readlineSync.question(`
        Please confirm token details\n
        Name: ${tokenName}
        Symbol: ${tokenSymbol}
        Decimals: ${decimals}
        Total supply: ${totalSupply}
        Token standard: ${tokenStandard}
        \n
        Press enter to continue or exit (CTRL + C):
    `, {defaultInput: 'Y'});

    if (confirm != "Y" && confirm != "y") return;
    
    // convert inputs
    tokenStandard = web3.utils.toHex(tokenStandard);
    totalSupply = await web3.utils.toWei(totalSupply.toString(), "ether");

    // prepare transaction
    let createTokenAction = tokensFactory.methods.createToken(tokenName, tokenSymbol, decimals, totalSupply, tokenStandard);
    let GAS = await web3Helper.estimateGas(createTokenAction, issuer, 1.2);
    let GAS_PRICE = await web3.eth.getGasPrice();

    // send transaction
    await createTokenAction.send({ from: issuer, gas: GAS, gasPrice:GAS_PRICE})
    .on('transactionHash', function(hash) {
        console.log(`
        Creating ${tokenSymbol} token. Please wait...
        TxHash: ${hash}`
        );
    })
    .on('receipt', function(receipt) {
        console.log(`
        Congratulations! The transaction was successfully completed.
        Token address: ${receipt.events['CreatedToken'].returnValues.tokenAddress}\n`
        );
    })
    .on('error', function(error) {
        console.log("Error", error);
    });
}

module.exports = {
    run: async function() {
        return run();
    }
}