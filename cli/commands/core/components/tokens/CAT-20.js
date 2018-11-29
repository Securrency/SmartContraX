var Component = require("../Component");
var action = require("../../actions/action");


/**
 * @fileoverview Containe all functions for the CAT-20 token
 * @namespace coreComponents Contains all smart contracts components
 */
class CAT20 extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "CAT20Token";
    }

    /**
     * Get token details
     * @public
     */
    getTokenDetails() {
        return new Promise((resolve, reject) => {
            this.getName()
            .then(name => {
                this.tokenName = name;
                this.getSymbol()
                .then(symbol => {
                    this.symbol = symbol;
                    this.getTotalSupply()
                    .then(totalSupply => {
                        this.totalSupply = totalSupply;
                        resolve();
                    })
                    .catch(error => {
                        reject(error);
                    });
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
     * Get token name
     * @public
     */
    getName() {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.name().call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Get token symbol
     * @public
     */
    getSymbol() {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.symbol().call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Get total supply
     * @public
     */
    getTotalSupply() {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.totalSupply().call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * ERC-20 transfer function
     * @param {string} to Recipient address
     * @param {string} value Number of the tokens to be 
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    transfer(to, value, sendFrom) {
        return new Promise((resolve, reject) => {
            let weiValue = this.web3.utils.toWei(value);
            let transferTokens = this.getInstance().methods.transfer(to, weiValue);
            let message = `Transfer ${value} ${this.symbol}. Please wait...`;

            action
            .setAction(transferTokens)
            .execute(sendFrom, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = new CAT20();