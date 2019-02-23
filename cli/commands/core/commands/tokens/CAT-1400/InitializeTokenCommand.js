var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 initialization
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class InitializeTokenCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "init";
        this.alias = "i"
        this.description = "Initialize tokens";
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
                .initializeToken(
                    this.components,
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
     * Request Components registry address
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

                this.rl.question("Components registry address: ", (components) => {
                    this.components = components;
                    if (!this.web3.utils.isAddress(this.components)) return reject("Invalid components registry address.");

                    resolve();
                });
            });
        }); 
    }
}