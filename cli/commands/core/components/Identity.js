var Component = require("./Component");
var action = require("../actions/action");


/**
 * @fileoverview Containe all functions for the identity
 * @namespace coreComponents Contains all smart contracts components
 */
class Identity extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "Identity";
    }

    /**
     * Returns wallet attribute
     * @param {string} wallet Wallet address
     * @param {string} attribute Attribute
     * @public
     */
    getWalletAttribute(wallet, attribute) {
        if (!this.web3.utils.isAddress(wallet)) throw new Error("Invalid wallet address.");
        if (!attribute) throw new Error("Invalid attribute.");
        
        let hexAttribute = this.web3.utils.toHex(attribute);

        return new Promise((resolve, reject) => {
            this.getInstance().methods.getWalletAttribute(wallet, hexAttribute).call((error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Set wallet attribute
     * @param {string} wallet Wallet address
     * @param {string} attribute Attribute to be set
     * @param {string} value The value which will be set for the attribute
     * @param {string} from Account from which transcation will be executed
     * @public
     */
    setWalletAttribute(wallet, attribute, value, from) {
        if (!this.web3.utils.isAddress(wallet)) throw new Error("Invalid wallet address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");
        if (!attribute) throw new Error("Invalid attribute.");
        if (!value) throw new Error("Invalid attribute value.");

        return new Promise((resolve, reject) => {
            let hexAttribute = this.web3.utils.toHex(attribute);

            let hexValue;
            if (value == "true" || value == "false") {
                hexValue = value == "true" ? "0x0100000000000000000000000000000000000000000000000000000000000000":
                "0x0200000000000000000000000000000000000000000000000000000000000000";
            } else {
                hexValue = this.web3.utils.toHex(value);    
            }
            
            console.log(`
                Hex values:
                Attributes: ${hexAttribute},
                Value: ${hexValue}
            `);

            let setAttr = this.getInstance().methods.setWalletAttribute(wallet, hexAttribute, hexValue);

            let message = `
                For wallet: ${wallet}
                set "${attribute}" = "${value}". Please wait...
            `;

            action
            .setAction(setAttr)
            .execute(from, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Delete wallet attribute
     * @param {string} wallet Wallet address
     * @param {string} attribute Attribute to be deleted
     * @param {string} from Account from which transcation will be executed
     * @public
     */
    deleteWalletAttribute(wallet, attribute, from) {
        if (!this.web3.utils.isAddress(wallet)) throw new Error("Invalid wallet address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");
        if (!attribute) throw new Error("Invalid attribute.");

        return new Promise((resolve, reject) => {
            let hexAttribute = this.web3.utils.toHex(attribute);

            let setAttr = this.getInstance().methods.deleteWalletAttribute(wallet, hexAttribute);

            let message = `
                For wallet: ${wallet}
                delete "${attribute}" attribute. Please wait...
            `;

            action
            .setAction(setAttr)
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

module.exports = new Identity();