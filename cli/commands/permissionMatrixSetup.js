const Web3 = require('web3');
var web3Helper = require('./helpers/web3Helper.js');

// permission module
let pm;

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
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

async function run() {
    let networkId = await web3.eth.net.getId();
    
    if (!initializePermissionModule(networkId)) {
        return false;
    }

    accounts = await web3.eth.getAccounts();

    // roles methods
    let systemMethods = [
        "updateExpirationInterval(uint256)",
        "removeTokenStrategy(bytes32)",
        "updateTokenStrategy(bytes32,address)",
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
        "createRollbackTransaction(address,address,address,uint256,uint256,string)",
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
}

module.exports = {
    run: async function() {
        return run();
    }
}