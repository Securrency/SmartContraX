const fs = require("fs");
const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = fs.readFileSync("./cli/mnemonic").toString();

module.exports = {
    networks: {
        default: {
            provider: new Web3(new Web3.providers.HttpProvider("http://localhost:8545")),
        },
        kovan: {
            provider: new Web3(new HDWalletProvider(mnemonic, "https://kovan.infura.io/", 0, 10)),
        },
        ropsten: {
            provider: new Web3(new HDWalletProvider(mnemonic, "https://ropsten.infura.io/", 0, 10)),
        }
    }
}