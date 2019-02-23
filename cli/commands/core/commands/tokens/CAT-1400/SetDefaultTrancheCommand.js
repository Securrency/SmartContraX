var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 default tranche
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class SetDefaultTrancheCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "setDT";
        this.alias = "sdt"
        this.description = "Set default tranche for the token";
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
                .setDefaultPartition(
                    this.tranche,
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
     * Request Components registry address
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

                this.rl.question("Tranche id: ", (id) => {
                    if (!id) return reject("Method id is required.");
                    this.tranche = id;
                
                    resolve();
                });
            });
        }); 
    }
}