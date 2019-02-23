var Command = require("../../Command");


/**
 * @fileoverview Contains command for CAT-1400 balanceOf by parititon method
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class BalanceOfByPartitionCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "balanceOfByPartition";
        this.alias = "bt"
        this.description = "Show account balance by specified tranche (partition)";
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
                .balanceOfByTranche(this.tranche, this.account)
                .then((result) => {
                    console.log(`Balance: ${this.web3.utils.fromWei(result, "ether")} ${this.contract.tokenSymbol}`);
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
     * Request account and tranche
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Tranche id: ", (tranche) => {
                this.tranche = tranche;
                if (!this.tranche) return reject("Tranche id is required.");
                this.rl.question("Account: ", (account) => {
                    this.account = account;
                    if (!this.web3.utils.isAddress(account)) {
                        this.account = this.accounts[account];
                    }
                    if (!this.web3.utils.isAddress(this.account)) return reject("Invalid account address.");
    
                    resolve();
                });
            });
        }); 
    }
}