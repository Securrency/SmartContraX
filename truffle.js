const fs = require("fs");
const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

const privateKey = fs.readFileSync("./privateKey").toString();

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    kovan: {
      provider: new HDWalletProvider(privateKey, "https://kovan.infura.io/"),
      network_id: "42",
      gas: 4500000,
      gasPrice: 5000000000
    },
    ropsten: {
      provider: new HDWalletProvider(privateKey, "https://ropsten.infura.io/"),
      network_id: "3",
      gas: 4500000,
      gasPrice: 5000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
