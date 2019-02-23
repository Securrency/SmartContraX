var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 tokens transfer
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class TransferCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "transfer";
        this.alias = "t"
        this.description = "Transfer tokens";
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
                .transfer(
                    this.recipient,
                    this.value,
                    this.sendFrom
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
     * Request sender, recipient, number of the tokens to transfer
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Sender: ", (sendFrom) => {
                this.sendFrom = sendFrom;
                if (!this.web3.utils.isAddress(sendFrom)) {
                    this.sendFrom = this.accounts[sendFrom];
                }
                if (!this.web3.utils.isAddress(this.sendFrom)) return reject("Invalid sender address.");

                this.rl.question("Recipient: ", (recipient) => {
                    this.recipient = recipient;
                    if (!this.web3.utils.isAddress(recipient)) {
                        this.recipient = this.accounts[recipient];
                    }
                    if (!this.web3.utils.isAddress(this.recipient)) return reject("Invalid sender address.");

                    this.rl.question("Value: ", (value) => {
                        this.value = value;
                        resolve();
                    });
                });
            });
        }); 
    }
}