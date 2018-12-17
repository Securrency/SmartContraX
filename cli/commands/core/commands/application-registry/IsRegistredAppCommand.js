var Command = require("../Command");


/**
 * @fileoverview Contains command for application verification
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class IsRegistredAppCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "isRegistredApp";
        this.alias = "ira"
        this.description = "Verify application registration";
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
                .isRegistredApp(
                    this.application,
                    this.token,
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
     * Request application & symbol
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Token address: ", (token) => {
                this.token = token;
                if (!this.web3.utils.isAddress(token)) {
                    this.token = "0x0000000000000000000000000000000000000000";
                }

                this.rl.question("Application: ", (application) => {
                    this.application = application;
                    if (!this.web3.utils.isAddress(this.application)) return reject("Invalid application.");

                    resolve();
                });
            });
        }); 
    }
}