var Command = require("../Command");


/**
 * @fileoverview Contains command for verification account in the whitelist
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class PresentInWhiteListCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "presentInWhiteList";
        this.alias = "p"
        this.description = "Verify account in the whitelist";
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
                .presentInWhiteList(
                    this.account,
                    this.token,
                    this.accounts[0]
                ).then((result) => {
                    console.log("Result: ", result);
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
     * Request investors accounts, token address 
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Token address: ", (token) => {
                this.token = token;
                if (!this.web3.utils.isAddress(token)) {
                    this.token = this.accounts[token];
                }
                if (!this.web3.utils.isAddress(this.token)) return reject("Invalid token address.");

                this.rl.question("Account: ", (account) => {
                    this.account = account;
                    if (!this.web3.utils.isAddress(account)) {
                        this.account = this.accounts[account];
                    }
                    if (!this.web3.utils.isAddress(this.account)) return reject("Invalid address.");

                    resolve();
                });
            });
        }); 
    }
}