var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-20 escrow cancellation
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CancelEscrowCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "cancelEscrow";
        this.alias = "cancelE"
        this.description = "Cancel escrow";
    }

    /**
     * Execute command
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.initializeDetails()
            .then(() => {
                // this.contract
                // .getEscrowById(this.escrowId)
                // .then((result) => {
                //     console.log(result);
                //     resolve(result);
                // })
                // .catch((err) => {
                //     reject(err);
                // });
                this.contract
                .cancelEscrow(
                    this.escrowId,
                    ".",
                    ".",
                    this.account,
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

                this.rl.question("Escrow id: ", (escrowId) => {
                    this.escrowId = escrowId;
                    resolve();
                });
            });
        }); 
    }
}