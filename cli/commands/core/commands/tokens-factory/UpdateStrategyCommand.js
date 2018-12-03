var Command = require("../Command");


/**
 * @fileoverview Contains command for a deployment strategy update 
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class UpdateStrategyCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "updateStrategy";
        this.alias = "update"
        this.description = "Update tokens deployment strategy";
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
                .updateTokenStrategy(this.standard, this.strategy, this.sendFrom)
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
     * Request parameters
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Address of the new deployment strategy: ", (strategy) => {
                this.strategy = strategy;
                if (!this.web3.utils.isAddress(this.strategy)) return reject("Invalid deployment strategy address.");
                this.rl.question("Send from: ", (sendFrom) => {
                    this.sendFrom = sendFrom;
                    if (!this.web3.utils.isAddress(sendFrom)) {
                        this.sendFrom = this.accounts[sendFrom];
                    }
                    if (!this.web3.utils.isAddress(this.sendFrom)) return reject("Invalid sender address.");

                    this.rl.question("Standard: ", (standard) => {
                        if (!standard) return reject("Standard can't be empty.");
                        this.standard = standard;
                        resolve();
                    });
                });
            });
        }); 
    }
}