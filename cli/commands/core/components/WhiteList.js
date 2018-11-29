var Component = require("./Component");
var action = require("../actions/action");

/**
 * @fileoverview Containe all functions for the WhiteList
 * @namespace coreComponents Contains all smart contracts components
 */
class WhiteList extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "WhiteList";
    }

    /**
     * Add provided accounts to the WhiteList
     * @param {array} investors Array of the account that will be added to the WhiteList
     * @param {string} token Token address
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    addArrayToWhiteList(investors, token, sendFrom) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

        for (let i = 0; i < investors.length; i++) {
            if (!this.web3.utils.isAddress(investors[i])) {
                throw new Error("Invalid investor address. Provided address: " + investors[i]);
            }
        }

        return new Promise((resolve, reject) => {
            let addToWL = this.getInstance().methods.addArrayToWhiteList(investors, token);
            let message = 'Adding to the whitelist. Please wait...';

            action
            .setAction(addToWL)
            .execute(sendFrom, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Check account in the whitelist
     * @param {string} who Address to be verified
     * @param {string} token Token address
     * @param {string} from Account from which transaction will be sent
     * @public
     */
    presentInWhiteList(who, token, from) {
        if (!this.web3.utils.isAddress(who)) throw new Error("Invalid address for verification.");
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            this.getInstance().methods.presentInWhiteList(who, token).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }
}

module.exports = new WhiteList();