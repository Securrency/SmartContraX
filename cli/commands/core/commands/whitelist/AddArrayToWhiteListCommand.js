var Command = require("../Command");


/**
 * @fileoverview Contains command for symbol ownership verification
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class AddArrayToWhiteListCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "addToWhiteList";
        this.alias = "add"
        this.description = "Add array of the invenstors to the Whitelist";
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
                .addArrayToWhiteList(
                    this.investors,
                    this.token,
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