/**
 * @fileoverview Provides base methods for each command
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class Command {
    /**
     * Set smart contract instance
     * @param {object} contract The configured smart contract instance
     * @public
     */
    setSmartContact(contract) {
        if (!contract) {
            throw new Error("Invalid tokens factory instance.");
        }
        this.contract = contract;
    }

    /**
     * Set accounts
     * @param {string[]} accounts Accounts
     * @public
     */
    setAccounts(accounts) {
        if (!accounts instanceof Array) {
            throw new Error("Invalid accounts array.");
        }
        this.accounts = accounts;
    }

    /**
     * Set web3 provider
     * @param {object} web3 Initialized web3 provider
     * @public
     */
    setWeb3(web3) {
        if (!web3) {
            throw new Error("Invalid web3 provider.");
        }
        this.web3 = web3;
    }

    /**
     * Set network id
     * @param {integer} networkId Network id
     * @public
     */
    setNetworkId(networkId) {
        if (!networkId) {
            throw new Error("Invalid network id.");
        }
        this.networkId = networkId;
    }

    /**
     * Set readline
     * @param {object} rl Readline
     * @public
     */
    setRl(rl) {
        if (!rl) {
            throw new Error("Invalid readline");
        }

        this.rl = rl;
    }
}