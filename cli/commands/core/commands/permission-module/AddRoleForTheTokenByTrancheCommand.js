var Command = require("../Command");


/**
 * @fileoverview Contains command for adding a new role to the token
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class AddRoleForTheTokenByTrancheCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "AddRoleForTheTokenByTranche";
        this.alias = "arfttbt"
        this.description = "Add role for the specific token by tranche";
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
                .addRoleForTheTokenByTranche(
                    this.tranche,
                    this.role,
                    this.account,
                    this.token,
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
     * Request account & role & token address & account from which the transaction will be sent
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("Account: ", (account) => {
                this.account = account;
                if (!this.web3.utils.isAddress(account)) {
                    this.account = this.accounts[account];
                }
                this.rl.question("Role: ", (role) => {
                    if (!role.length) {
                       return reject("Invalid role");
                    }
                    this.role = role;
                    this.rl.question("Tranche id: ", (tranche) => {
                        this.tranche = tranche;
                        if (!this.tranche) {
                            return reject("Tranche is required.");
                        }
                        this.rl.question("Token address: ", (token) => {
                            if (!this.web3.utils.isAddress(token)) {
                                return reject("Invalid token address");
                            }
                            this.token = token;
                            this.rl.question("Send from: ", (from) => {
                                this.from = from;
                                if (!this.web3.utils.isAddress(from)) {
                                    this.from = this.accounts[from];
                                }
                                resolve();
                            });
                        });
                    });
                });
            });
        }); 
    }
}