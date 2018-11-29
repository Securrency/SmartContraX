var Component = require("./Component");
var action = require("../actions/action");


/**
 * @fileoverview Containe all functions for the Tokens Factory initialization
 * @namespace coreComponents Contains all smart contracts components
 */
class SymbolRegistry extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "SymbolRegistry";
    }

    /**
     * Verify symbol owner
     * @param {string} symbol Symbol to be verified (in hex)
     * @param {string} account Wallet (20 bytes)
     * @param {string} from Wallet from which transaction will be sent
     * @public
     */
    isSymbolOwner(symbol, account, from) {
        if (!symbol) throw new Error("Invalid symbol.");
        if (!this.web3.utils.isAddress(account)) throw new Error("Invalid account address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            this.getInstance().methods.isSymbolOwner(symbol, account).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Verify symbol owner
     * @param {string} symbol Symbol to be verified (in hex)
     * @param {string} from Wallet from which transaction will be sent
     * @public
     */
    symbolIsAvailable(symbol, from) {
        if (!symbol) throw new Error("Invalid symbol.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            this.getInstance().methods.symbolIsAvailable(symbol).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Register new symbol
     * @param {string} symbol Symbol to be verified (in hex)
     * @param {string} from Wallet from which transaction will be sent
     * @public
     */
    registerSymbol(symbol, from) {
        if (!symbol) throw new Error("Invalid symbol.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid owner account.");

        return new Promise((resolve, reject) => {
            let regSymbol = this.getInstance().methods.registerSymbol(symbol, this.web3.utils.toHex("test"));

            let message = `Register ${this.web3.utils.toAscii(symbol)} symbol. Please wait...`;
    
            action
            .setAction(regSymbol)
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

module.exports = new SymbolRegistry();