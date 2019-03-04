var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 clawback method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class ClawbackCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "clawback";
        this.alias = "c"
        this.description = "Move tokens from one account to another";
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
                .clawback(
                    this.from,
                    this.to,
                    this.value,
                    this.tranche,
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
     * Request account, token, sender address, recipient address, number of the tokens to transfer
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

                this.rl.question("Transfer tokens from: ", (from) => {
                    this.from = from;
                    if (!this.web3.utils.isAddress(from)) {
                        this.from = this.accounts[from];
                    }
                    if (!this.web3.utils.isAddress(this.from)) return reject("Invalid account address.");

                    this.rl.question("Recipient address: ", (to) => {
                        this.to = to;
                        if (!this.web3.utils.isAddress(to)) {
                            this.to = this.accounts[to];
                        }
                        if (!this.web3.utils.isAddress(this.to)) return reject("Invalid recipient address.");

                        this.rl.question("Tranche id: ", (tranche) => {
                            this.tranche = tranche;
                            if (!this.tranche) return reject("Tranche id is required.");
                            
                            this.rl.question("Value: ", (value) => {
                                this.value = value;
                                if (this.value == 0) return reject("Invalid number of the tokens.");
                                
                                resolve();
                            });
                        });

                    });
                });
            });
        }); 
    }
}