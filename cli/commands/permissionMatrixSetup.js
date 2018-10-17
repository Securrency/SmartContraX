let readlineSync = require('readline-sync');
let web3Helper = require('./helpers/web3Helper.js');

const config = require('../cli-config.js');

// permission module
let pm;

// Web3 provider
let web3;

// localhost network
const localhost = 'localhost';

function initializeWeb3(selectedNetwork) {
    let network;
    
    if (selectedNetwork != localhost) {
        network = readlineSync.question("Network (default localhost:8545): ");
    }

    if (!network) {
        web3 = config.networks.default.provider;
    } else {
        web3 = config.networks[network].provider;
    }

    return true;
}

function createId(signature) {
    let hash = web3.utils.keccak256(signature);

    return hash.substring(0, 10);
}

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

async function run(netowrk) {
    initializeWeb3(netowrk);
    
    let networkId = await web3.eth.net.getId().catch((err) => {
        console.log(err);
        process.exit(1);
    });
    
    if (!initializePermissionModule(networkId)) {
        process.exit(1);
    }

    
    accounts = await web3.eth.getAccounts().catch((err) => {
        console.log(err);
        process.exit(1);
    });;
    

    // roles methods
    let systemMethods = [
        "updateExpirationInterval(uint256)",
        "removeTokenStrategy(bytes32)",
        "updateTokenStrategy(bytes32,address)",
        "updateComponent(address,address)",
        "removeComponent(address)",
        "acceptTokensFromOtherChain(address,address,address,bytes32,bytes32,bytes32,uint256,uint256)",
    ];

    let ownerMethods = [];
    
    let registrationMethods = [
        "registerSymbol(bytes,bytes)",
        "renewSymbol(bytes)",
        "transferOwnership(bytes,address,bytes)"
    ];

    let issuerMethods = [
        "createToken(string,string,uint8,uint256,bytes32)",
    ];
    
    let complianceMethods = [
        "addToWhiteList(address,address)",
        "removeFromWhiteList(address,address)",
        "addArrayToWhiteList(address[],address)",
        "createRollbackTransaction(address,address,address,uint256,uint256,string)",
        "mint(address,uint256)",
        "mint(address)",
        "crossChainTransfer(uint256,bytes32,bytes32)",
    ];

    let rolesData = [
        {role: "Owner", parent: "", account: accounts[0], methods: ownerMethods},
        {role: "System", parent: "Owner", account: accounts[0], methods: systemMethods},
        {role: "Registration", parent: "System", account: accounts[0], methods: registrationMethods},
        {role: "Issuer", parent: "System", account: accounts[0], methods: issuerMethods},
        {role: "Compliance", parent: "Issuer", account: accounts[0], methods: complianceMethods},
    ];
    
    for (let i = 0; i < rolesData.length; i++) {
        console.log("\x1b[2m", `Role: ${rolesData[i].role} - ${rolesData[i].account}`);
        if (i > 1) {
            let action = pm.methods.createRole(web3.utils.toHex(rolesData[i].role), web3.utils.toHex(rolesData[i].parent));
            let GAS = await web3Helper.estimateGas(action, accounts[0], 1.2);
            let GAS_PRICE = await web3.eth.getGasPrice();
            let result = await action.send({ from: accounts[0], gas: GAS, gasPrice:GAS_PRICE}).then((receipt) => {
                return receipt.valueOf();
            });
            console.log("\x1b[2m", `Create role ${rolesData[i].role} ${result.transactionHash}`);

            action = pm.methods.addRoleToTheWallet(rolesData[i].account, web3.utils.toHex(rolesData[i].role));
            GAS = await web3Helper.estimateGas(action, accounts[0], 1.2);
            GAS_PRICE = await web3.eth.getGasPrice();
            result = await action.send({ from: accounts[0], gas: GAS, gasPrice:GAS_PRICE}).then((receipt) => {
                return receipt.valueOf();
            });
            console.log("\x1b[2m", `Add role ${rolesData[i].role} ${result.transactionHash}`);
        } 
        
        console.log("\x1b[2m", "Methods:");
        for (let j = 0; j < rolesData[i].methods.length; j++) {
            let action = pm.methods.addMethodToTheRole(createId(rolesData[i].methods[j]), web3.utils.toHex(rolesData[i].role));
            let GAS = await web3Helper.estimateGas(action, accounts[0], 1.2);
            let GAS_PRICE = await web3.eth.getGasPrice();
            let result = await action.send({ from: accounts[0], gas: GAS, gasPrice:GAS_PRICE}).then((receipt) => {
                return receipt.valueOf();
            });
            console.log("\x1b[2m", `${rolesData[i].methods[j]}: ${createId(rolesData[i].methods[j])}, tx: ${result.transactionHash}`);
        }
        console.log('\n');
    }
    process.exit(0);
}

module.exports = {
    run: async function(network) {
        return run(network);
    }
}