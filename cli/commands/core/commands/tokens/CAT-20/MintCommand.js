var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 mint method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class MintCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "mint";
        this.alias = "m"
        this.description = "Mint new tokens";
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
                .mint(
                    this.to,
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
     * Request recipient address, number of the tokens to mint
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

                this.rl.question("Recipient address: ", (to) => {
                    this.to = to;
                    if (!this.web3.utils.isAddress(to)) {
                        this.to = this.accounts[to];
                    }
                    if (!this.web3.utils.isAddress(this.to)) return reject("Invalid recipient address.");

                    this.rl.question("Tokens to mint: ", (value) => {
                        this.value = value;
                        if (this.value == 0) return reject("Invalid number of the tokens.");
                        
                        resolve();
                    });
                });
            });
        }); 
    }
}