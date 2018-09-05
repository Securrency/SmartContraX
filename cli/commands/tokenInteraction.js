
const Web3 = require('web3');
var readlineSync = require('readline-sync');
var web3Helper = require('./helpers/web3Helper.js');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let tokenAddress;
let tokenABI;
let token;

// Token details
let tokenName;
let symbol;
let totalSupply;

function initializeToken() {
    try {
        tokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/SLS20Token.json').toString()).abi;
        token = new web3.eth.Contract(tokenABI, tokenAddress);
        token.setProvider(web3.currentProvider);
    } catch(err) {
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function run() {
    console.log('\x1b[34m%s\x1b[0m',"Instrument for token interaction");

    accounts = await web3.eth.getAccounts();

    tokenAddress =  readlineSync.question('Enter token address: ');
    if(!web3.utils.isAddress(tokenAddress)) {
        console.log("invalid token address.");
        return;
    }

    initializeToken();

    tokenName = await token.methods.name().call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }
        return result;
    });

    symbol = await token.methods.symbol().call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }
        return result;
    });

    totalSupply = await token.methods.totalSupply().call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }
        return result;
    });

    let totalSupplyConverted = web3.utils.fromWei(totalSupply, "ether");

    console.log(`
        Name: ${tokenName}\n
        Symbol: ${symbol}\n
        Total supply: ${totalSupplyConverted} ${symbol}\n
    `);

    startInteraction(tokenAddress);
}

async function startInteraction() {
    let command =  readlineSync.question('Enter command: ');
    switch(command) {
        case '--b':
        case '--balanceOf':
            getBalance();
            break;
        case '--a':
        case '--accounts':
            accountsList();
            break;
        case '--r':
        case '--rollbackTx':
            txRollBack();
            break;
        case '--txh':
        case '--txHistory':
            readTxHistory();
            break;
        case '--txr':
        case '--txRollbacksHistory':
            readRollbacksHistory();
            break;
        case '--cp':
        case '--capTable':
            getCapTable();
            break;
        case '--t':
        case '--transfer':
            transfer();
            break;
        case '--uet':
        case '--updateCheckpointExpirationTime':
            updateExpirationTime();
            break;
        case '--help':
            showHelpMessage();
            break; 
        default:
            console.log("Invalid command \""+command+"\". Use --help.");
            startInteraction();
    };
}

async function updateExpirationTime() {
    let newTime =  readlineSync.question('New time: ');
    newTime = parseInt(newTime);
    
    try {
        let action = token.methods.updateExpirationTime(newTime);
        // send transaction
        sendTransaction(accounts[0], action);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }

    
}

function getCapTable() {
    console.log('Cap table:');

    let holders = {};

    readCapTableFromTxH(holders)
    .then((holders) => {
        showCapTable(holders);
        startInteraction();
    });
}

function showCapTable(holders) {
    let num = 1;
    for (var address in holders) {
        if (holders[address] != 0) {
            let value = web3.utils.fromWei(holders[address].toString(), "ether");
            console.log(`${num} ${address} ${value} ${symbol}`);
            num++;
        }
    }
}

function readCapTableFromTxH(holders) {
    return new Promise((resolve, reject) => {
        token.getPastEvents('Transfer', {
            filter: {_from: accounts[0]},
            fromBlock: 0,
            toBlock: 'latest'
        }, function(error, events) {
            if (error) {
                console.log(error);
                return;
            }
            for (i=0; i < events.length; i++) {
                let from = events[i].returnValues.from;
                let to = events[i].returnValues.to;
                let value = events[i].returnValues.value;
                
                if (typeof holders[to] == 'undefined') {
                    holders[to] = 0;
                }
                
                if (from != '0x0000000000000000000000000000000000000000') {
                    holders[from] -= parseInt(value);
                }
                
                holders[to] += parseInt(value);
            }
            resolve(holders);
        }
        );
    });
}

function readCapTableFromTxR(holders) {
    return new Promise((resolve, reject) => {
        token.getPastEvents('RollbackTransaction', {
            filter: {_from: accounts[0]},
            fromBlock: 0,
            toBlock: 'latest'
        }, function(error, events) {
            if (error) {
                console.log(error);
                return;
            }
            holders = processCapTableEventResult(events, holders);
            resolve(holders);
        }
        );
    });
}

function processCapTableEventResult(events, holders) {
    for (i=0; i < events.length; i++) {
        let from = events[i].returnValues.from;
        let to = events[i].returnValues.to;
        let value = events[i].returnValues.tokens;
        
        if (typeof holders[to] == 'undefined') {
            holders[to] = 0;
        }
        
        if (from != '0x0000000000000000000000000000000000000000') {
            holders[from] -= parseInt(value);
        }
        
        holders[to] += parseInt(value);
    }

    return holders;
}

function readTxHistory() {
    console.log('Transactions history:');
    token.getPastEvents('Transfer', {
            filter: {_from: accounts[0]},
            fromBlock: 0,
            toBlock: 'latest'
        }, function(error, events) {
            let num = 1;
            for (i=events.length-1; i != 0; i--) {
                let from = events[i].returnValues.from;
                let to = events[i].returnValues.to;
                let value = events[i].returnValues.value;
                value = web3.utils.fromWei(value, "ether");
                logTx(num, from, to, value, symbol)
                num++;
            }
            startInteraction();
        }
    );
}

function readRollbacksHistory() {
    console.log('Transactions rollbacks history:');
    token.getPastEvents('RollbackTransaction', {
            filter: {_from: accounts[0]},
            fromBlock: 0,
            toBlock: 'latest'
        }, function(error, events){
            if (error) {
                console.log(error);
                return;
            }

            if (events.length != 0) {
                showHistory(events);
            } else {
                console.log('Rollback history is empty.');
            }
            
            startInteraction();
        }
    );
}

function showHistory(events) {
    let num = 1;
    for (i=events.length-1; i >= 0; i--) {
        if (typeof events[i] != 'undefined') {
            let from = events[i].returnValues.from;
            let to = events[i].returnValues.to;
            let value = events[i].returnValues.tokens;
            value = web3.utils.fromWei(value, "ether");
            logTx(num, from, to, value, symbol)
            num++;
        }
    }
}

function logTx(num, from, to, value, symbol) {
    console.log(`${num}. ${from} -> ${to} ${value} ${symbol}`);
}
async function txRollBack() {
    let txHash =  readlineSync.question('TxHash: ');

    let receipt = await web3.eth.getTransactionReceipt(txHash);
    let checkpointId = parseInt(receipt.logs[0].topics[2]);

    let from = prepareAddressFromLog(receipt.logs[1].topics[1]);
    let to = prepareAddressFromLog(receipt.logs[1].topics[2]);
    let value = parseInt(receipt.logs[1].data);

    try {
        let action = token.methods.createRollbackTransaction(to, from, value, checkpointId, txHash);
        // send transaction
        let message = 'Create rollback transaction. Please wait...';
        sendTransaction(from, action, message);
    } catch (error) {
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

function prepareAddressFromLog(toConvert) {
    let str = '0x';
    for(let i = 26; i < toConvert.length; i++) {
        str = str + toConvert[i];
    }

    return str;
}

async function transfer() {
    let from =  readlineSync.question('From: ');
    if (!web3.utils.isAddress(from)) {
        from = accounts[from];
    }
    
    let to = readlineSync.question('To: ');
    if (!web3.utils.isAddress(to)) {
        to = accounts[to];
    }
    
    let valueOne = readlineSync.question('Value: ');
    value = web3.utils.toWei(valueOne);

    let action = token.methods.transfer(to, value);

    // send transaction
    let message = `Transfer ${valueOne} ${symbol} . Please wait...`;
    sendTransaction(from, action, message);
}

async function getBalance() {
    let tokenHolder =  readlineSync.question('Token holder address: ');
    if(!web3.utils.isAddress(tokenHolder)) {
        tokenHolder = accounts[tokenHolder];
    }

    await token.methods.balanceOf(tokenHolder).call({ from: accounts[0] }, function (error, result) {
        let balance = result;
        balance = web3.utils.fromWei(balance, "ether");

        console.log("Balance:", balance, symbol);

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
        supported commands:\n
        --acounts (--a) Show list of all accounts
        --transfer (--t) Transfer tokens
        --rollbackTx (--r) Create rollback transaction
        --balanceOf (--b) Get account balance
        --txHistory (--txh) Show transactions history
        --txRollbacksHistory (--txr) Show rollbacks history
        --updateCheckpointExpirationTime (--uet) Update checkpoint expiration time
        --capTable (--cp) Show cap table
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