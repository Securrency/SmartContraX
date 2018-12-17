var Command = require("../Command");


/**
 * @fileoverview Contains command for application creation in the CAT registry
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CreateCATAppCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "createCATApp";
        this.alias = "cCATApp"
        this.description = "Create application in the CAT registry";
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
                .createCATApp(
                    this.application,
                    this.accounts[0]
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
     * Request application & symbol
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Application: ", (application) => {
                this.application = application;
                if (!this.web3.utils.isAddress(this.application)) return reject("Invalid application.");

                resolve();
            });
        }); 
    }
}