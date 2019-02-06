var Command = require("../Command");


/**
 * @fileoverview Contains command which allows getting wallet attribute value
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class GetWalletAttributeCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "getWalletAttribute";
        this.alias = "getWA"
        this.description = "Get attribute value for the specified wallet";
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
                .getWalletAttribute(
                    this.wallet,
                    this.attribute
                ).then((result) => {
                    console.log(` = ${this.web3.utils.toAscii(result)}`);
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
     * Requests wallet & attribute
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Wallet: ", wallet => {
                this.wallet = wallet;
                if (!this.web3.utils.isAddress(this.wallet)) this.wallet = this.accounts[this.wallet];
                if (!this.web3.utils.isAddress(this.wallet)) return reject("Invalid application.");

                this.rl.question("Attribute: ", attribute => {
                    if (!attribute) return reject("An attribute can not e empty.");
                    this.attribute = attribute;

                    resolve();
                });
            });
        }); 
    }
}