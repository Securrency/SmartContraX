const fs = require("fs");
const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic = fs.readFileSync("./cli/mnemonic").toString();

module.exports = {
    networks: {
        default: {
            provider: new Web3(new HDWalletProvider(mnemonic, "http://localhost:8545", 0, 10)),
        },
        kovan: {
            provider: new Web3(new HDWalletProvider(mnemonic, "https://kovan.infura.io/", 0, 10)),
        },
        ropsten: {
            provider: new Web3(new HDWalletProvider(mnemonic, "https://ropsten.infura.io/", 0, 10)),
        },
        gochain: {
            provider: new Web3(new HDWalletProvider(mnemonic, "https://testnet-rpc.gochain.io/", 0, 10)),
        }
    }
}