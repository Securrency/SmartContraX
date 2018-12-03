var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 crosschain transfer
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CrossChainTransferCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "crossChainTransfer";
        this.alias = "cct"
        this.description = "Move tokens to other chain";
    }

    /**
     * Execute command
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.initializeDetails()
            .then(() => {
                this.contract
                .crossChainTransfer(
                    this.value,
                    this.chain,
                    this.recipient,
                    this.account
                )
                .then((result) => {
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

    /**
     * Request details of the transfer
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Send request from: ", (account) => {
                this.account = account;
                if (!this.web3.utils.isAddress(account)) {
                    this.account = this.accounts[account];
                }
                if (!this.web3.utils.isAddress(this.account)) return reject("Invalid account address.");

                this.rl.question("Target chain: ", (chain) => {
                    this.chain = chain;
                    if (!this.chain) return reject("Target chain can't be empty.");

                    this.rl.question("Tokens to transfer: ", (value) => {
                        this.value = value;
                        if (this.value == 0) return reject("Invalid number of the tokens.");
                        
                        this.rl.question("Recipient address: ", (recipient) => {
                            this.recipient = recipient;
                            if (!this.recipient) return reject("Recipient address can't be empty.");
                            
                            resolve();
                        });
                    });
                });
            });
        }); 
    }
}