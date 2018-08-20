/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

const HDWalletProvider = require("truffle-hdwallet-provider-privkey");
const privKey = "36beb3c9f46a286336cfcf6f811407df4eac3604320979610ce9bb80ba82a714";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(privKey, "https://ropsten.infura.io/v3/d3701984a52343279f84fa70be964b66"),
      network_id: "3",
      gas: 4500000,
      gasPrice: 5000000000
    },
    kovan: {
      provider: new HDWalletProvider(privKey, "https://kovan.infura.io/v3/d3701984a52343279f84fa70be964b66"),
      network_id: "42",
      gas: 4500000,
      gasPrice: 5000000000
    }
  }
};
