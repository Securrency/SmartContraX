var Command = require("../Command");


/**
 * @fileoverview Contains command for the registration of the wallet attribute
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class SetWalletAttributeCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "setWalletAttribute";
        this.alias = "setWA"
        this.description = "Set attribute for the specified wallet";
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
                .setWalletAttribute(
                    this.wallet,
                    this.attribute,
                    this.value,
                    this.from
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
     * Requests wallet, attribute & attribute value
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Wallet: ", wallet => {
                this.wallet = wallet;
                if (!this.web3.utils.isAddress(this.wallet)) this.wallet = this.accounts[this.wallet];
                if (!this.web3.utils.isAddress(this.wallet)) return reject("Invalid application.");

                this.rl.question("Attribute: ", attribute => {
                    if (!attribute) return reject("An attribute can not be empty.");
                    this.attribute = attribute;

                    this.rl.question("Value: ", value => {
                        value = value === true ? "true" : value;
                        value = value === false ? "false" : value;
                        if (!value) return reject("An value can not be empty.");
                        this.value = value;

                        this.rl.question("Send from: ", from => {
                            this.from = from;
                            if (!this.web3.utils.isAddress(this.from)) this.from = this.accounts[this.from];
                            if (!this.web3.utils.isAddress(this.from)) return reject("Invalid sender address.");

                            resolve();
                        });
                    });
                })
            });
        }); 
    }
}