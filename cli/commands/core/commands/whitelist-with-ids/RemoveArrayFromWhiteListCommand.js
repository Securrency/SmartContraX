var Command = require("../Command");


/**
 * @fileoverview Contains command for removals investors from the whitelist
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class RemoveArrayFromWhiteListCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "removeFromWhiteList";
        this.alias = "remove"
        this.description = "Remove array of the invenstors from the Whitelist";
        this.investors = [];
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
                .removeArrayFromWhiteList(
                    this.investors,
                    this.token,
                    this.tranche,
                    this.sendFrom
                ).then((result) => {
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
     * Request investors accounts, tranche, token address
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

                this.rl.question("Tranche id: ", (tranche) => {
                    this.tranche = tranche;
                    if (!this.tranche) return reject("Tranche id is required.");
                    
                    this.rl.question("Send from: ", (sendFrom) => {
                        this.sendFrom = sendFrom;
                        if (!this.web3.utils.isAddress(sendFrom)) {
                            this.sendFrom = this.accounts[sendFrom];
                        }
                        if (!this.web3.utils.isAddress(this.sendFrom)) return reject("Invalid sender address.");
    
                        this.requestAddress()
                        .then(() => {
                            resolve();
                        });
                    });
                });
            });
        }); 
    }

    /**
     * Requests investor address
     * @private
     */
    requestAddress() {
        return new Promise((resolve, reject) => {
            this.rl.question("Investor address: ", (investor) => {
                if (investor == "") resolve(false);
                
                if (!this.web3.utils.isAddress(investor)) {
                    investor = this.accounts[investor];
                }
                if (!this.web3.utils.isAddress(investor)) return reject("Invalid investor address.");
    
                this.investors.push(investor);
                
                resolve(this.requestAddress());
            })
        });
    }
}