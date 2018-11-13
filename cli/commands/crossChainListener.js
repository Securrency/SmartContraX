let readlineSync = require('readline-sync');

let web3Helper = require('./helpers/web3Helper.js');

const config = require('../cli-config.js');

console.log(`
 ____    _____    ____   _   _   ____    ____    _____   _   _    ____  __   __
/ ___|  | ____|  / ___| | | | | |  _ \\  |  _ \\  | ____| | \\ | |  / ___| \\ \\ / /
\\___ \\  |  _|   | |     | | | | | |_) | | |_) | |  _|   |  \\| | | |      \\ V / 
 ___) | | |___  | |___  | |_| | |  _ <  |  _ <  | |___  | |\\  | | |___    | |  
|____/  |_____|  \\____|  \\___/  |_| \\_\\ |_| \\_\\ |_____| |_| \\_|  \\____|   |_|

`);

// Web3 provider
let web3;
let accounts;

const ERC20 = 'ERC-20';
const CAT20 = 'CAT-20';

let tokenABI;
let token;

let lastBlock;
let providers = [];
let chainName;

let moduleAbi;
let transferModuleAddress;
let transferModule;
let storageAddress;
let FCStorage;

async function initializeWeb3() {
    let network = readlineSync.question("Network for listening (default ropsten): ");
    chainName = readlineSync.question("Chain name: ");

    if (!network) {
        web3 = config.networks.ropsten.provider;
        providers["GoChain"] = config.networks.gochain.provider;
    } else {
        web3 = config.networks[network].provider;
        providers["Ethereum"] = config.networks.ropsten.provider;
    }

    accounts = await web3.eth.getAccounts();

    return true;
}

function initializeToken(tokenStandard) {
    try {
        if (tokenStandard == ERC20 || tokenStandard == CAT20) {
            tokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/CAT20Token.json').toString()).abi;
        } else {
            tokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/CAT721Token.json').toString()).abi;
        }
        
        
    } catch(err) {
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function initializeTransferModule(networkId) {
    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/TransferModule.json').toString());
        moduleAbi = file.abi;
        transferModuleAddress = file.networks[networkId].address;
        let txHash = file.networks[networkId].transactionHash;
        let receipt = await web3.eth.getTransactionReceipt(txHash);

        lastBlock = await web3.eth.getBlockNumber();//receipt.blockNumber;
        
        transferModule = new web3.eth.Contract(moduleAbi, transferModuleAddress);
        transferModule.setProvider(web3.currentProvider);
    } catch(err) {
        console.log(err);
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function initializeFCStorage(networkId) {
    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/FCStorage.json').toString());
        storageAbi = file.abi;
        storageAddress = file.networks[networkId].address;

        FCStorage = new web3.eth.Contract(storageAbi, storageAddress);
        FCStorage.setProvider(web3.currentProvider);
    } catch(err) {
        console.log(err);
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function run() {
    console.log(` 
  ____                    ____ _           _            ____     _   _____    ____   ___  
 / ___|_ __ ___  ___ ___ / ___| |__   __ _(_)_ __      / ___|   / \\ |_   _|  |___ \\ / _ \\ 
| |   | '__/ _ \\/ __/ __| |   | '_ \\ / _\` | | '_ \\     | |     / _ \\  | |_____ __) | | | |
| |___| | | (_) \\__ \\__ \\ |___| | | | (_| | | | | |    | |___ / ___ \\ | |_____/ __/| |_| |
 \\____|_|  \\___/|___/___/\\____|_| |_|\\__,_|_|_| |_|     \\____/_/    \\_\\_|    |_____|\\___/ 
                                                   
`);

    initializeWeb3();

    let networkId = await web3.eth.net.getId().catch((err) => {
        console.log(err);
        process.exit(1);
    });

    initializeTransferModule(networkId);
    initializeFCStorage(networkId);
    initializeToken(CAT20);
    
    watch();
}

async function watch() {
    setTimeout(function(){ 
        console.log(chainName, lastBlock);
        FCStorage.getPastEvents('SentToOtherChain', {
            fromBlock: lastBlock,
            toBlock: 'latest'
        }, async function(error, events) {
            if (error) {
                console.log(error);
                return;
            }

            for (let i = 0; i < events.length; i++) {
                processing = true;

                lastBlock = events[i].blockNumber + 1;

                let fromTokenAddress = events[i]["returnValues"]["0"];
                let txId = parseInt(events[i]["returnValues"]["2"]);
                let toChain = events[i]["returnValues"]["3"];

                let j = toChain.length - 1;
                while(toChain[j] == 0) {
                    j--;
                }

                toChain = toChain.substring(0, j+1);
                toChain = web3.utils.toAscii(toChain);

                token = new web3.eth.Contract(tokenABI, fromTokenAddress);
                token.setProvider(web3.currentProvider);

                let symbol = await token.methods.symbol().call({ from: accounts[0] }, function (error, result) {
                    if (error) {
                        console.log(error);
                    }
                    return result;
                });

                let sr = await getSymbolRegistry(toChain);

                let tokenAddress = await sr.methods.getTokenBySymbol(web3.utils.toHex(symbol)).call({ from: accounts[0] }, function (error, result) {
                    if (error) {
                        console.log(error);
                    }
                    return result;
                });

                let recipient = events[i]["returnValues"]["4"].replace("000000000000000000000000", "");
                let sentFrom = events[i]["returnValues"]["1"];
                let originalTxHash = events[i].transactionHash;
                let value = events[i]["returnValues"]["5"];

                let tm = await getTransferModule(toChain);

                let action = tm.methods.acceptTokensFromOtherChain(
                    fromTokenAddress,
                    recipient,
                    tokenAddress,
                    sentFrom,
                    web3.utils.toHex(chainName),
                    originalTxHash,
                    value,
                    txId
                );

                // send transaction
                let message = `Transfer ${web3.utils.fromWei(events[i].returnValues.value)} ${symbol} . To the ${toChain}. Please wait...`;
                sendTransaction(accounts[0], action, message, toChain);
            }

            if (events.length == 0) {
                let block = await web3.eth.getBlockNumber();
                lastBlock = block + 1;
            }

            watch();
        }
        );
    }, 3000);
}

async function getTransferModule(chain) {
    let provider = providers[chain];

    let networkId = await provider.eth.net.getId().catch((err) => {
        console.log(err);
        process.exit(1);
    });

    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/TransferModule.json').toString());
        let mAbi = file.abi;
        let tma = file.networks[networkId].address;

        let tm = await new web3.eth.Contract(mAbi, tma);
        tm.setProvider(provider.currentProvider);

        return tm;
    } catch(err) {
        console.log(err);
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function getSymbolRegistry(chain) {
    let provider = providers[chain];

    let networkId = await provider.eth.net.getId().catch((err) => {
        console.log(err);
        process.exit(1);
    });

    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/SymbolRegistry.json').toString());
        let mAbi = file.abi;
        let tma = file.networks[networkId].address;
        
        let sr = await new web3.eth.Contract(mAbi, tma);
        sr.setProvider(provider.currentProvider);

        return sr;
    } catch(err) {
        console.log(err);
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that token is compiled and deployed.");
        return;
    }
}

async function sendTransaction(from, action, message='Create transaction. Please wait...', chain) {
    let provider = providers[chain];
    try {
        let GAS = await web3Helper.estimateGas(action, from, 2);
        let GAS_PRICE = await provider.eth.getGasPrice() * 1.5;

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
            processing = false;
        })
        .on('error', function(error) {
            console.log("Error", error);
        });
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
    }
}

module.exports = {
    run: async function() {
        return run();
    }
}
