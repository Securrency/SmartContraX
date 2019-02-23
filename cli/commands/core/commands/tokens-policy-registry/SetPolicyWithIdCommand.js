var Command = require("../Command");


/**
 * @fileoverview Contains command for the registration of the token policy
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class SetPolicyWithIdCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "setPolicyWithId";
        this.alias = "setPWid"
        this.description = "Set policy for the specified token and action with an additional identifier";
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
                .setPolicyWithId(
                    this.tranche,
                    this.token,
                    this.action,
                    this.policy,
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
     * Request token, tranche id, action
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Token: ", token => {
                this.token = token;
                if (!this.web3.utils.isAddress(this.token)) return reject("Invalid token address.");

                this.rl.question("Tranche id: ", tranche => {
                    this.tranche = tranche;
                    if (!this.tranche) return reject("Tranche is required.");

                    this.rl.question("Action: ", action => {
                        if (!action) return reject("An action can not be empty.");
                        this.action = action;
    
                        this.rl.question("Policy: ", policy => {
                            if (!policy) return reject("An policy can not be empty.");
                            this.policy = policy;
    
                            this.rl.question("Send from: ", from => {
                                this.from = from;
                                if (!this.web3.utils.isAddress(this.from)) this.from = this.accounts[this.from];
                                if (!this.web3.utils.isAddress(this.from)) return reject("Invalid application.");
    
                                resolve();
                            });
                        });
                    });
                });
            });
        }); 
    }
}