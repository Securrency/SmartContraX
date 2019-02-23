var Component = require("./Component");
var action = require("../actions/action");

/**
 * @fileoverview Containe all functions for the WhiteList with additional id's (tranches)
 * @namespace coreComponents Contains all smart contracts components
 */
class WhiteListWithIds extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "WhiteListWithIds";
    }

    /**
     * Add provided accounts to the WhiteList
     * @param {array} investors Array of the account that will be added to the WhiteList
     * @param {string} token Token address
     * @param {string} id Additional identifier
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    addArrayToWhiteList(investors, token, id, sendFrom) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (!id) throw new Error("Id is required.");

        for (let i = 0; i < investors.length; i++) {
            if (!this.web3.utils.isAddress(investors[i])) {
                throw new Error("Invalid investor address. Provided address: " + investors[i]);
            }
        }

        return new Promise((resolve, reject) => {
            let hexId = this.web3.utils.toHex(id);
            let addToWL = this.getInstance().methods.addArrayToWhiteList(investors, token, hexId);
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
     * Add provided accounts from the WhiteList
     * @param {array} investors Array of the account that will be removed from the WhiteList
     * @param {string} token Token address
     * @param {string} id Additional identifier
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    removeArrayFromWhiteList(investors, token, id, sendFrom) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (!id) throw new Error("Id is required.");

        for (let i = 0; i < investors.length; i++) {
            if (!this.web3.utils.isAddress(investors[i])) {
                throw new Error("Invalid investor address. Provided address: " + investors[i]);
            }
        }

        return new Promise((resolve, reject) => {
            let hexId = this.web3.utils.toHex(id);
            let removeFromWL = this.getInstance().methods.removeArrayFromWhiteList(investors, token, hexId);
            let message = 'Removing from the whitelist. Please wait...';

            action
            .setAction(removeFromWL)
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
     * @param {string} id Additional identifier
     * @param {string} from Account from which transaction will be sent
     * @public
     */
    presentInWhiteList(who, token, id, from) {
        if (!this.web3.utils.isAddress(who)) throw new Error("Invalid address for verification.");
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");
        if (!id) throw new Error("Id is required.");

        return new Promise((resolve, reject) => {
            let hexId = this.web3.utils.toHex(id);
            this.getInstance().methods.presentInWhiteList(who, token, hexId).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }
}

module.exports = new WhiteListWithIds();