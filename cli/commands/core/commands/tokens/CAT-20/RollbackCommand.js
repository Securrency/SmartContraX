var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 rollback
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class RollbackCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "rollback";
        this.alias = "r"
        this.description = "Create transaction rollback";
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
                .createRollbackTransaction(
                    this.txHash,
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
     * Request 
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

                this.rl.question("Transaction: ", (tx) => {
                    if (!tx) throw new Error("Transaction hash can't be empty.");
                    this.txHash = tx;
                    resolve();
                });
            });
        }); 
    }
}