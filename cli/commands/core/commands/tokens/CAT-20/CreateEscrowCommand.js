var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 createEscrow method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CreateEscrowCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "createEscrow";
        this.alias = "ce"
        this.description = "Create escrow";
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
                .createEscrow(
                    this.holder,
                    this.escrow,
                    this.value,
                    ".",
                    ".",
                    this.exId,
                    this.canCancel,
                    this.call,
                    this.account
                )
                .then((result) => {
                    console.log(`Escrow id: ${result.events["EscrowCreated"].returnValues[0]}`);
                    // console.log(result.events["EscrowCreated"].returnValues);
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

                this.rl.question("Tokenholder: ", (holder) => {
                    this.holder = holder;
                    if (!this.web3.utils.isAddress(holder)) {
                        this.holder = this.accounts[holder];
                    }
                    if (!this.web3.utils.isAddress(this.holder)) return reject("Invalid account address.");

                    this.rl.question("Escrow agent: ", (escrow) => {
                        this.escrow = escrow;
                        if (!this.web3.utils.isAddress(escrow)) {
                            this.escrow = this.accounts[escrow];
                        }
                        if (!this.web3.utils.isAddress(this.escrow)) {
                            this.escrow = "0x0000000000000000000000000000000000000000";
                        }

                        this.rl.question("Value: ", (value) => {
                            this.value = value;
                            if (this.value == 0) return reject("Invalid number of the tokens.");
                            
                            this.rl.question("Can cancel: ", (canCancel) => {
                                if (canCancel == "true") {
                                    this.canCancel = 1;
                                } else {
                                    this.canCancel = 0;
                                }
                                
                                this.rl.question("Execute call: ", (call) => {
                                    this.call = call;
                                    this.rl.question("External id: ", (exId) => {
                                        this.exId = exId;
                                        resolve();
                                    });
                                });
                            });
                        });

                    });
                });
            });
        }); 
    }
}