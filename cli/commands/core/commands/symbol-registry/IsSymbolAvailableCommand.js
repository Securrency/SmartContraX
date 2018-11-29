var Command = require("../Command");


/**
 * @fileoverview Contains command for symbol ownership verification
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class IsSymbolAvailableCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "symbolIsAvailable";
        this.alias = "isa"
        this.description = "Verify symbol availability";
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
                .symbolIsAvailable(
                    this.hexSymbol,
                    this.accounts[0]
                ).then((result) => {
                    console.log(`Result: ${result}`);
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
            this.rl.question("Symbol: ", (symbol) => {
                if (symbol.length < 1 || symbol.length > 5) {
                    reject("Symbol length must be beetwen 1 & 5");
                }
                this.hexSymbol = this.web3.utils.toHex(symbol);
                resolve();
            });
        }); 
    }
}