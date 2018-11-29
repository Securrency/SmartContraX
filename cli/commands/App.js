const providersFactory = require("./core/providers/providersFactory");
const conductor = require("./core/Conductor");


/**
 * @fileoverview Provides core functions for all applications
 * @namespace application Core applications
 */
module.exports = class App {
    /**
     * Initialize network
     * @public
     */
    initializeNetwork() {
        return new Promise((resolve, reject) => {
            this.rl.question("Network (default localhost:8545): ", async (network) => {
                this.web3 = providersFactory.getProvider(network);
                this.accounts = await this.web3.eth.getAccounts();
                this.networkId = await this.web3.eth.net.getId();
                if (!this.web3 || !this.accounts || !this.networkId) {
                    reject();
                }
                resolve();
            });
        });
    }

    /**
     * Initialize application with smart contract
     * @param {object} contract Smart contracts component (Symbol registry || Tokens factory ...)
     * @public
     */
    initializeApp(contract) {
        if (!contract) throw new Error("Invalid contract.");

        this.contract = contract;
        this.contract.initialize(this.networkId, this.web3);
    }

    /**
     * Request command
     * @public
     */
    question() {
        this.rl.question("Enter command: ", (command) => {
            this.processCommand(command)
            .then(() => {
                this.question();
            })
            .catch(error => {
                console.error(error);
                this.question();
            });            
        });
    }

    /**
     * Remove empty bytes from the string
     * @param {string} string String from which empty bytes must be removed 
     */
    removeEmptyBytesFromAscii(string) {
        let i = string.length - 1;
        while(string.charCodeAt(i) == 0) {
            i--;
        }

        return string.substring(0, i+1);
    }

    /**
     * Process select command
     * @param {string} command Command to be executed
     * @private
     */
    processCommand(command) {
        return new Promise((resolve, reject) => {
            this.commandsCollection
            .getCommand(command)
            .then(commandToRun => {
                commandToRun.setSmartContact(this.contract);
                commandToRun.setAccounts(this.accounts);
                commandToRun.setWeb3(this.web3);
                commandToRun.setNetworkId(this.networkId);
                commandToRun.setRl(this.rl);
                
                conductor
                .run(commandToRun)
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                });
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}