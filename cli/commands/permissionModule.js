let readlineSync = require('readline-sync');
let web3Helper = require('./helpers/web3Helper.js');

const config = require('../cli-config.js');

// permission module
let pm;

// Web3 provider
let web3;

function initializeWeb3() {
    let network = readlineSync.question("Network (default localhost:8545): ");

    if (!network) {
        web3 = config.networks.default.provider;
    } else {
        web3 = config.networks[network].provider;
    }

    return true;
}

let accounts;
let ownerRole = "Owner";
let hexOwnerRole;

function initializePermissionModule(networkId) {
    try {
        let file = JSON.parse(require('fs').readFileSync('./build/contracts/PermissionModule.json').toString());
        let pmABI = file.abi;
        pmAddress = file.networks[networkId].address;
        
        pm = new web3.eth.Contract(pmABI, pmAddress);
        pm.setProvider(web3.currentProvider);
    } catch (err) {
        console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that permission module is compiled and deployed.");
        return false;
    }
    return true;
}

async function run() {
    initializeWeb3();

    let networkId = await web3.eth.net.getId();

    if (!initializePermissionModule(networkId)) {
        return false;
    }
    
    accounts = await web3.eth.getAccounts();

    hexOwnerRole = web3.utils.toHex(ownerRole);

    startInteraction();
}

async function startInteraction() {
    let command =  readlineSync.question('Enter command: ');
    switch(command) {
        case '--accounts':
        case '--a':
            accountsList();
            break;
        case '--createRole':
        case '--cr':
            createRole();
            break;
        case '--getWalletRoles':
        case '--gwl':
            getWalletRoles();
            break;
        case '--addRoleToTheWallet':
        case '--arttw':
            addRoleToTheWallet();
            break;
        case '--getRoleMethods':
        case '--grm':
            getRoleMethods();
            break;
        case '--addMethodToTheRole':
        case '--amttr':
            addMethodToTheRole();
            break;
        case '--removeMethodFromTheRole':
        case '--rmftr':
            removeMethodFromTheRole();
            break;
        case '--getListOfAllRoles':
        case '--gloar':
            getListOfAllRoles();
            break;
        case '--createId':
        case '--ci':
            createId();
            break;
        case '--addRoleForTheToken':
        case '--arftt':
            addRoleForTheToken();
            break;
        case '--help':
            showHelpMessage();
            break; 
        default:
            console.log("Invalid command \""+command+"\". Use --help.");
            startInteraction();
    };
}

function createId() {
    let signature = readlineSync.question('Enter method signature: ');
    let hash = web3.utils.keccak256(signature);

    console.log(`Method id: ${hash.substring(0, 10)}`);

    startInteraction();
}

async function getWalletRoles() {
    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }

    await pm.methods.getWalletRoles(account).call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            let msg = '\n';
            for (let i = 0; i < result.length; i++) {
                if (result[i] == '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    break;
                }
                msg += `${web3.utils.toAscii(result[i])} \n`;
            }
            console.log(msg);
        } else {
            console.log('No roles.');
        } 

        startInteraction();
    });
}

async function getRoleMethods() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);
    
    await pm.methods.getSupportedMethodsByRole(hexRoleName).call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            let msg = '\n';
            for (let i = 0; i < result.length; i++) {
                msg += `${result[i]} \n`;
            }
            console.log(msg);
        } else {
            console.log('No methods.');
        } 

        startInteraction();
    });
}

async function getListOfAllRoles() {
    await pm.methods.getListOfAllRoles().call({ from: accounts[0] }, function (error, result) {
        if (error) {
            console.log(error);
        }

        if (result.length > 0) {
            let msg = '\n';
            for (let i = 0; i < result.length; i++) {
                msg += `${web3.utils.toAscii(result[i])} \n`;
            }
            console.log(msg);
        } else {
            console.log('No methods.');
        } 

        startInteraction();
    });
}

async function createRole() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);

    try {
        let action = pm.methods.createRole(hexRoleName, hexOwnerRole);
        let message = 'Creating the role. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function addRoleForTheToken() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);

    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }

    let token = readlineSync.question('Enther token: ');

    let from =  readlineSync.question('Send from: ');
    if (!web3.utils.isAddress(from)) {
        from = accounts[from];
    }

    try {
        let action = pm.methods.addRoleForSpecificToken(account, token, hexRoleName);
        let message = 'Adding role for a specific token. Please wait...';
        sendTransaction(from, action, message);
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function addMethodToTheRole() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);

    let method = readlineSync.question('Enther method: ');

    try {
        let action = pm.methods.addMethodToTheRole(method, hexRoleName);
        let message = 'Adding method to the role. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function removeMethodFromTheRole() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);

    let method = readlineSync.question('Enther method: ');

    try {
        let action = pm.methods.removeMethodFromTheRole(method, hexRoleName);
        let message = 'Adding method to the role. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
}

async function addRoleToTheWallet() {
    let roleName = readlineSync.question('Enter role name: ');
    let hexRoleName = web3.utils.toHex(roleName);

    let account =  readlineSync.question('Account: ');
    if (!web3.utils.isAddress(account)) {
        account = accounts[account];
    }
    
    try {
        let action = pm.methods.addRoleToTheWallet(account, hexRoleName);
        let message = 'Adding role to the wallet. Please wait...';
        sendTransaction(accounts[0], action, message);
    } catch (error) {
        console.log(error);
        console.log('Transaction reverted by EVM.');
        return startInteraction();
    }
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
        --createRole (--cr) Craete new role in the permission module
        --getWalletRoles (--gwl) Get list of the wallet roles
        --addRoleToTheWallet (--arttw) Add role to the wallet
        --getRoleMethods (--grm) Get list of the role methods
        --addMethodToTheRole (--amttr) Add method to the role
        --removeMethodFromTheRole (--rmftr) Remove metod from the role
        --addRoleForTheToken (--arftt) Add role for the specific token
        --getListOfAllRoles (--gloar) Get list of the all roles
        --createId (--ci) Create method id
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