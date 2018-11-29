var Command = require("../Command");


/**
 * @fileoverview Contains command for symbol ownership verification
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class RegisterSymbolCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "registerSymbol";
        this.alias = "rs";
        this.description = "Register new symbol";
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
                .registerSymbol(
                    this.hexSymbol,
                    this.account
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
     * Request account & symbol
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Owner account: ", (account) => {
            
                this.account = account;
                if (!this.web3.utils.isAddress(account)) {
                    this.account = this.accounts[account];
                }

                this.rl.question("Symbol: ", (symbol) => {
                    if (symbol.length < 1 || symbol.length > 5) {
                        reject("Symbol length must be beetwen 1 & 5");
                    }
                    this.hexSymbol = this.web3.utils.toHex(symbol);
                    resolve();
                });
            });
        }); 
    }
}