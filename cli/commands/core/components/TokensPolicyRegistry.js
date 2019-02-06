var Component = require("./Component");
var action = require("../actions/action");


/**
 * @fileoverview Containe all functions for the tokens policy registry
 * @namespace coreComponents Contains all smart contracts components
 */
class TokensPolicyRegistry extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "TokensPolicyRegistry";
    }

    /**
     * Returns tokens policy
     * @param {string} token Token address
     * @param {string} action Action
     * @public
     */
    getPolicy(token, action) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!action) throw new Error("Invalid action.");
        
        let hexAction = this.web3.utils.toHex(action);

        return new Promise((resolve, reject) => {
            this.getInstance().methods.getPolicy(token, hexAction).call((error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Set token policy for specific action
     * @param {string} token Token address
     * @param {string} tokenAction Action
     * @param {string} policy Converted policy to the Rules Engine Protocol
     * @param {string} from Account from which transcation will be executed
     * @public
     */
    setPolicy(token, tokenAction, policy, from) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");
        if (!tokenAction) throw new Error("Invalid action.");
        if (!policy) throw new Error("Invalid policy value.");

        return new Promise((resolve, reject) => {
            let setP = this.getInstance().methods.setPolicy(token, tokenAction, policy);

            let message = `Set policy for the token: ${token}. Please wait...`;

            action
            .setAction(setP)
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

module.exports = new TokensPolicyRegistry();