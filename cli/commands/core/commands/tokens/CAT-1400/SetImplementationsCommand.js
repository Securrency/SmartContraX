var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 methods initialization
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class SetImplementationsCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "setI";
        this.alias = "si"
        this.description = "Set methods implementations";
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
                .setImplementations(
                    this.ids,
                    this.methods,
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
     * Request method id and address of the implementation
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

                this.rl.question("Method id: ", (id) => {
                    if (!id) return reject("Method id is required.");
                    this.ids = [id];
                
                    this.rl.question("Method implementation: ", (impl) => {
                        if (!impl) return reject("Address of the method implementation is required.");
                        if (!this.web3.utils.isAddress(impl)) return reject("Invalid method implementation address.");
                        this.methods = [impl];
    
                        resolve();
                    });
                });
            });
        }); 
    }
}