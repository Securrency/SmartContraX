var Command = require("../Command");


/**
 * @fileoverview Contains command for the deletions wallets attributes
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class DeleteWalletAttributeCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "deleteWalletAttributeCommand";
        this.alias = "delWA"
        this.description = "Delete attribute for the specified wallet";
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
                .deleteWalletAttribute(
                    this.wallet,
                    this.attribute,
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

                    this.rl.question("Send from: ", from => {
                        this.from = from;
                        if (!this.web3.utils.isAddress(this.from)) this.from = this.accounts[this.from];
                        if (!this.web3.utils.isAddress(this.from)) return reject("Invalid application.");

                        resolve();
                    });
                })
            });
        }); 
    }
}