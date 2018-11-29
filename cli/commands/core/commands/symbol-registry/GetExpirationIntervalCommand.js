var Command = require("../Command");


/**
 * @fileoverview Get symbol expiration interval command
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class GetExpirationIntervalCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "getExpirationInterval";
        this.alias = "gei"
        this.description = "Get symbol expiration interval";
    }

    /**
     * Execute command
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.contract
            .getExpirationInterval(
                this.accounts[0]
            ).then((result) => {
                console.log(`Result: ${result} sec.`);
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}