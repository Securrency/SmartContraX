const Web3 = require('web3');
var readlineSync = require('readline-sync');
var web3Helper = require('./helpers/web3Helper.js');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let accounts;
let registryAddress;
let registry;

function initializeSymbolRegistry(networkId) {
    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/SymbolRegistry.json').toString());
        let registryABI = file.abi;
        registryAddress = file.networks[networkId].address;
        
        registry = new web3.eth.Contract(registryABI, registryAddress);
        registry.setProvider(web3.currentProvider);
    } catch (err) {
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that symbols registry is compiled and deployed.");
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
        case '--registerSymbol':
        case '--regS':
            registerSymbol();
            break;
        case '--registerSymbol':
        case '--iso':
            isSymbolOwner();
            break;
        case '--getSymbolExpireDate':
        case '--gsed':
            getSymbolExpireDate();
            break;
        case '--renewSymbol':
        case '--renS':
            renewSymbol();
            break;
        case '--transferOwnership':
        case '--to':
            transferOwnership();
            break;
        case '--getExpirationInterval':
        case '--gei':
            getExpirationInterval();
            break;
        case '--updateExpirationInterval':
        case '--uei':
            updateExpirationInterval();
            break;
        case '--help':
            showHelpMessage();
            break; 
        default:
            console.log("Invalid command \""+command+"\". Use --help.");
            startInteraction();
    };
}

async function getSymbolExpireDate() {
    let symbol =  readlineSync.question('Symbol: ');
    let hexSymbol = web3.utils.toHex(symbol);

    let expireDate = await registry.methods.getSymbolExpireDate(hexSymbol).call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }
        return result;
    });

    var date = new Date(expireDate*1000);

    console.log(date);

    startInteraction();
}

async function renewSymbol() {
    let from =  readlineSync.question('Owner account: ');
    if (!web3.utils.isAddress(from)) {
        from = accounts[from];
    }

    let symbol =  readlineSync.question('Symbol: ');
    let hexSymbol = web3.utils.toHex(symbol);

    try {
        let action = registry.methods.renewSymbol(hexSymbol);
        let message = 'Create renew symbol transaction. Please wait...';
        sendTransaction(from, action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function transferOwnership() {
    let from =  readlineSync.question('Owner account: ');
    if (!web3.utils.isAddress(from)) {
        from = accounts[from];
    }

    let to =  readlineSync.question('New owner account: ');
    if (!web3.utils.isAddress(to)) {
        to = accounts[to];
    }

    let symbol =  readlineSync.question('Symbol: ');
    let hexSymbol = web3.utils.toHex(symbol);

    try {
        let action = registry.methods.transferOwnership(hexSymbol, to);
        let message = 'Create transfer ownership transaction. Please wait...';
        sendTransaction(from, action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function registerSymbol() {
    let from =  readlineSync.question('Owner account: ');
    if (!web3.utils.isAddress(from)) {
        from = accounts[from];
    }

    let symbol =  readlineSync.question('Symbol: ');
    let hexSymbol = web3.utils.toHex(symbol);
    try {
        let action = registry.methods.registerSymbol(hexSymbol, web3.utils.toHex("test"));
        let message = 'Register new symbol. Please wait...';
        sendTransaction(from, action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM. 1');
        return startInteraction();
    }
}

async function updateExpirationInterval() {
    let newInterval =  readlineSync.question('New interval: ');
    try {
        let action = registry.methods.updateExpirationInterval(newInterval);
        let message = 'Set new expiration interval. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function isSymbolOwner() {
    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }

    let symbol =  readlineSync.question('Symbol: ');
    let hexSymbol = web3.utils.toHex(symbol);

    await registry.methods.isSymbolOwner(hexSymbol, account).call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        console.log('Is owner: ', result);

        startInteraction();
    });
}

async function getExpirationInterval() {
    await registry.methods.exprationInterval().call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        console.log('Expiration interval: ', result);

        startInteraction();
    });
}

async function sendTransaction(from, action, message='Create transaction. Please wait...') {
    try {
        let GAS = await web3Helper.estimateGas(action, from, 1.2);
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
        --transferOwnership (--to) Transfer symbol ownership
        --getSymbolExpireDate (--gsed) Get symbol expire date
        --registerSymbol (--regS) Register new symbol
        --renewSymbol (--renS) Renew symbol
        --isSymbolOwner (--iso) Check if address is symbol owner
        --getExpirationInterval (--gei) Get expiration interval 
        --updateExpirationInterval (--uei) Get expiration interval 
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