var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 get rollbacks status
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class GetRollbacksStatusCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "rollbackEnabled";
        this.alias = "rs"
        this.description = "Rollbacks status";
    }

    /**
     * Execute command
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.contract
            .getRollbacksStatus()
            .then((result) => {
                let message = result ? "enabled" : "disabled";
                console.log(`Rollbacks are ${message}`);
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}