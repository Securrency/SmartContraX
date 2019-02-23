var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 tokens transfer by tranche (partition)
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class TransferByTrancheCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "transferByTranche";
        this.alias = "tbt";
        this.description = "Transfer tokens by tranche (partition)";
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
                .transferByTranche(
                    this.tranche,
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
     * Request tranche id, sender address, recipient address, number of the tokens to transfer
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Tranche id: ", (tranche) => {
                this.tranche = tranche;
                if (!this.tranche) return reject("Tranche is required.");

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
                        if (!this.web3.utils.isAddress(this.recipient)) return reject("Invalid recipient address.");
    
                        this.rl.question("Value: ", (value) => {
                            this.value = value;
                            if (!this.value) return reject("Number of the tokens to transfer can't be empty.");
                            resolve();
                        });
                    });
                });
            });
        }); 
    }
}