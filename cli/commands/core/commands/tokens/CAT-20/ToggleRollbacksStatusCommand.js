var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 toggle rollbacks status
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class ToggleRollbacksStatusCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "toggleRollbacksStatus";
        this.alias = "trs"
        this.description = "Toggle rollbacks status";
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
                .toggleRollbacksStatus(this.account)
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