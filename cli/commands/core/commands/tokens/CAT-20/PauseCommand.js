var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 pause method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class PauseCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "pause";
        this.alias = "pause"
        this.description = "Freezing all tokens transfers";
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
                .pause(this.account)
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
     * Request sender account
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

                resolve();
            });
        }); 
    }
}