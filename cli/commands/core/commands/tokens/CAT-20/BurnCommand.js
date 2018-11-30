var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 burn method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class BurnCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "burn";
        this.alias = "burn"
        this.description = "Burn tokens";
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
                .burn(
                    this.value,
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
     * Request number of the tokens to burn
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

                this.rl.question("Tokens to burn: ", (value) => {
                    this.value = value;
                    if (this.value == 0) return reject("Invalid number of the tokens.");
                    
                    resolve();
                });
            });
        }); 
    }
}