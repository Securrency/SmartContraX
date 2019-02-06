var Command = require("../Command");


/**
 * @fileoverview Contains command which allows getting token policy
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class GetPolicyCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "getPolicy";
        this.alias = "getP"
        this.description = "Get token policy";
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
                .getPolicy(
                    this.token,
                    this.action
                ).then((result) => {
                    console.log(result);
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
            this.rl.question("Token: ", token => {
                this.token = token;
                if (!this.web3.utils.isAddress(this.token)) this.token = this.accounts[this.token];
                if (!this.web3.utils.isAddress(this.token)) return reject("Invalid token address.");

                this.rl.question("Action: ", action => {
                    if (!action) return reject("An action can not be empty.");
                    this.action = action;

                    resolve();
                });
            });
        }); 
    }
}