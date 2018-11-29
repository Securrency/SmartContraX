var Component = require("./Component");
var action = require("../actions/action");

/**
 * @fileoverview Containe all functions for the Permission module
 * @namespace coreComponents Contains all smart contracts components
 */
class PermissionModule extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "PermissionModule";
    }

    /**
     * Add role for specific token
     * @param {string} role Role
     * @param {string} account Account for which will be added role
     * @param {string} token Token address
     * @param {string} from Account from which will be initiated transaction
     * @public
     */
    addRoleForTheToken(role, account, token, from) {
        if (!role) throw new Error("Invalid role.");
        if (!this.web3.utils.isAddress(account)) throw new Error("Invalid account address.");
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            let addRole = this.getInstance().methods.addRoleForSpecificToken(
                account,
                token,
                this.web3.utils.toHex(role)
            );

            let message = `Adding "${role}" role. Please wait...`;
    
            action
            .setAction(addRole)
            .execute(from, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = new PermissionModule();