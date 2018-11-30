var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 balanceOf method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class BalanceOfCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "balanceOf";
        this.alias = "b"
        this.description = "Show account balance";
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
                .balanceOf(this.account)
                .then((result) => {
                    this.contract
                    .getNumberOfTokensOnHold(this.account)
                    .then((onHold) => {
                        console.log(`Balance: ${this.web3.utils.fromWei(result, "ether")} ${this.contract.tokenSymbol}`);
                        console.log(`On hold: ${this.web3.utils.fromWei(onHold, "ether")} ${this.contract.tokenSymbol}`);
                        resolve({
                            balance: result,
                            onHold: onHold
                        });
                    });
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
     * Request account
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Account: ", (account) => {
                this.account = account;
                if (!this.web3.utils.isAddress(account)) {
                    this.account = this.accounts[account];
                }
                if (!this.web3.utils.isAddress(this.account)) return reject("Invalid account address.");

                resolve();
            });
        }); 
    }
}