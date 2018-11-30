var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 tokens holds
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class MoveTokensFromHoldCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "moveTokensFromHold";
        this.alias = "mtfh"
        this.description = "Move tokens from hold";
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
                .moveTokensFromHold(
                    this.account,
                    this.value,
                    this.from,
                    this.note
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
     * Request account, sender address, number of the tokens
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Send request from: ", (from) => {
                this.from = from;
                if (!this.web3.utils.isAddress(from)) {
                    this.from = this.accounts[from];
                }
                if (!this.web3.utils.isAddress(this.from)) return reject("Invalid account address.");

                this.rl.question("Account: ", (account) => {
                    this.account = account;
                    if (!this.web3.utils.isAddress(account)) {
                        this.account = this.accounts[account];
                    }
                    if (!this.web3.utils.isAddress(this.account)) return reject("Invalid account address.");

                    this.rl.question("Value: ", (value) => {
                        this.value = value;
                        if (this.value == 0) return reject("Invalid number of the tokens.");
                        
                        this.rl.question("Note: ", (note) => {
                            this.note = note;
                            resolve();
                        });
                    });
                });
            });
        }); 
    }
}