const Web3 = require('web3');
var readlineSync = require('readline-sync');
var web3Helper = require('./helpers/web3Helper.js');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let accounts;
let whiteListAddress;
let whiteList;

function initializeSymbolRegistry(networkId) {
    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/WhiteList.json').toString());
        let whiteListABI = file.abi;
        whiteListAddress = file.networks[networkId].address;
        
        whiteList = new web3.eth.Contract(whiteListABI, whiteListAddress);
        whiteList.setProvider(web3.currentProvider);
    } catch (err) {
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that WhiteList is compiled and deployed.");
        return false;
    }
    return true;
}

async function run() {
    let networkId = await web3.eth.net.getId();
    
    if (!initializeSymbolRegistry(networkId)) {
        return false;
    }

    accounts = await web3.eth.getAccounts();

    startInteraction();
}

async function startInteraction() {
    let command =  readlineSync.question('Enter command: ');
    switch(command) {
        case '--accounts':
        case '--a':
            accountsList();
            break;
        case '--add':
            addToTheWhiteList();
            break;
        case '--remove':
            remove();
            break;
        case '--checkAddress':
        case '--ca':
            checkAddress();
            break;
        case '--help':
            showHelpMessage();
            break; 
        default:
            console.log("Invalid command \""+command+"\". Use --help.");
            startInteraction();
    };
}

async function addToTheWhiteList() {
    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }
    
    let tokenAddress =  readlineSync.question('Enter token address: ');
    if(!web3.utils.isAddress(tokenAddress)) {
        console.log("invalid token address.");
        return;
    }

    try {
        let action = whiteList.methods.addToWhiteList(account, tokenAddress);
        let message = 'Adding to the whitelist. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function remove() {
    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }
    
    let tokenAddress =  readlineSync.question('Enter token address: ');
    if(!web3.utils.isAddress(tokenAddress)) {
        console.log("invalid token address.");
        return;
    }

    try {
        let action = whiteList.methods.removeFromWhiteList(account, tokenAddress);
        let message = 'Removing from the whitelist. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function checkAddress() {
    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }
    
    let tokenAddress =  readlineSync.question('Enter token address: ');
    if(!web3.utils.isAddress(tokenAddress)) {
        console.log("invalid token address.");
        return;
    }

    await whiteList.methods.presentInWhiteList(account, tokenAddress).call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        console.log('Result: ', result);

        startInteraction();
    });
}

async function sendTransaction(from, action, message='Create transaction. Please wait...') {
    try {
        let GAS = await web3Helper.estimateGas(action, from, 2);
        let GAS_PRICE = await web3.eth.getGasPrice();

        await action.send({ from: from, gas: GAS, gasPrice:GAS_PRICE})
        .on('transactionHash', function(hash) {
            console.log(`
            ${message}
            TxHash: ${hash}`
            );
        })
        .on('receipt', function(receipt) {
            console.log(`
            Congratulations! The transaction was successfully completed.\n`
            );
            startInteraction();
        })
        .on('error', function(error) {
            console.log("Error", error);
        });
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

function accountsList() {
    let list = '';
    for(let i = 0; i < accounts.length; i++) {
        list = list + i + " " + accounts[i] + "\n";
    }

    console.log(list);

    startInteraction();
}

function showHelpMessage() {
    console.log(`

        --accounts (--a) Show list of all accounts
        \n
        --help Show list of all supported commands
    `);

    startInteraction();
}

module.exports = {
    run: async function() {
        return run();
    }
}