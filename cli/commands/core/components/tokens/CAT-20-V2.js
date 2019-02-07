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
        this.name = "ICAT20Token";
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
                    this.supportsInterface("0x18160ddd")
                    .then((supports) => {
                        if (supports) {
                            this.getTotalSupply()
                            .then(totalSupply => {
                                this.totalSupply = totalSupply;
                                resolve();
                            })
                            .catch(error => {
                                reject(error);
                            });
                        } else {
                            this.totalSupply = 0;
                            resolve();
                        }
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
                this.tokenName = result;
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
                this.tokenSymbol = result;
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
     * Get total supply
     * @param {string} interfaceID Smart contract method identifier
     * @public
     */
    supportsInterface(interfaceID) {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.supportsInterface(interfaceID).call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Get account balance
     * @param {string} account Account address
     * @public
     */
    balanceOf(account) {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.balanceOf(account).call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * CAT-20 initialization method
     * @param {string} components Components registry address
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    initializeToken(components, sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(components)) throw new Error("Invalid components registry address.");
            let initializeToken = this.getInstance().methods.initializeToken(components);

            let message = `Token initialization. Please wait...`;

            action
            .setAction(initializeToken)
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
     * Set methods inmplementations
     * @param {string} ids Methods ids
     * @param {string} addrs Implementations addresses
     * @param {string} sendFrom Account from which will be executed transaction
     */
    setImplementations(ids, addrs, sendFrom) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < addrs.length; i++) {
                if (!this.web3.utils.isAddress(addrs[i])) throw new Error("Invalid implementation address.");
            }
            let initMethods = this.getInstance().methods.setImplementations(ids, addrs);

            let message = `Initialize methods. Please wait...`;

            action
            .setAction(initMethods)
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

    /**
     * CAT-20 clawback function
     * @param {string} from Account from which tokens will be transferred
     * @param {string} to Recipient address
     * @param {integer} value Number of the tokens to be transferred
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    clawback(from, to, value, sendFrom) {
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid address.");
        if (!this.web3.utils.isAddress(to)) throw new Error("Invalid recipient address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (value == 0) throw new Error("An invalid number of the tokens to send.");

        return new Promise((resolve, reject) => {
            let weiValue = this.web3.utils.toWei(value);
            let clawback = this.getInstance().methods.clawback(from, to, weiValue);
            let message = `
                    Create clawback ${value} ${this.symbol}. 
                    From: ${from}
                    To:   ${to}
                    Please wait...
                `;

            action
            .setAction(clawback)
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
     * CAT-20 mintfunction
     * @param {string} to Recipient address
     * @param {integer} value Numbet of the tokens to mint
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    mint(to, value, sendFrom) {
        if (!this.web3.utils.isAddress(to)) throw new Error("Invalid recipient address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (value == 0) throw new Error("An invalid number of the tokens to send.");

        return new Promise((resolve, reject) => {
            let weiValue = this.web3.utils.toWei(value);
            let mint = this.getInstance().methods.mint(to, weiValue);
            let message = `
                    Minting ${value} ${this.symbol}.
                    To:   ${to}
                    Please wait...
                `;

            action
            .setAction(mint)
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
     * Get transaction receipt
     * @param {string} txHash Transaction hash
     */
    getTransactionReceipt(txHash) {
        return new Promise((resolve, reject) => {
            this.web3.eth.getTransactionReceipt(txHash, (err, result) => {                    
                err ? reject(err) : resolve(result);
            });
        });
    }

    /**
     * Get address
     * @param {string} toConvert Address 32 bytes from the log 
     * @private
     */
    prepareAddressFromLog(toConvert) {
        let str = '0x';
        for(let i = 26; i < toConvert.length; i++) {
            str = str + toConvert[i];
        }
    
        return str;
    }
}

module.exports = new CAT20();