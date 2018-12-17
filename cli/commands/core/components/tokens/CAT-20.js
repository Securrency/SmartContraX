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
     * Get number of the held tokens for an account
     * @param {string} account Account address
     * @public
     */
    getNumberOfTokensOnEscrow(account) {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.getTokensOnEscrow(account).call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Get rollbacks status (Enabled/Disabled)
     * @public
     */
    getRollbacksStatus() {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.rollbackEnabled().call({}, (error, result) => {
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

    /**
     * CAT-20 batch transfer function
     * @param {array} investors Array of the investors
     * @param {array} tokens Array of the numbers of the tokens
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    batchTransfer(investors, tokens, sendFrom) {
        for (let i = 0; i < investors.length; i++) {
            if (!this.web3.utils.isAddress(investors[i])) {
                throw new Error("Invalid investor address. Provided address: " + investors[i]);
            }
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] <= 0) throw new Error("Invalid number of the tokens.");
        }
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            let transferTokens = this.getInstance().methods.batchTransfer(investors, tokens);
            let message = `Batch transfer for ${investors.length} investors. Please wait...`;

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
     * Cross chain tokens transfer
     * @param {integer} value Number of tokens to transfer
     * @param {string} chain Target chain name
     * @param {string} recipient Recipient address in the target chain
     * @param {string} sendFrom Account from which will be executed transaction
     */
    crossChainTransfer(value, chain, recipient, sendFrom) {
        if (value <= 0) throw new Error("Invalid number of the tokens.");
        if (!chain) throw new Error("Invalid target chain.");
        if (!recipient) throw new Error("Invalid recipient address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            let wieValue = this.web3.utils.toWei(value);
            let hexChain = this.web3.utils.toHex(chain);
            let transferTokens = this.getInstance().methods.crossChainTransfer(wieValue, hexChain, recipient);
            let message = `Transfer tokens to ${chain}. Please wait...`;

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
     * @param {string} note Some note about clawback
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    clawback(from, to, value, note, sendFrom) {
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid address.");
        if (!this.web3.utils.isAddress(to)) throw new Error("Invalid recipient address.");
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (value == 0) throw new Error("An invalid number of the tokens to send.");

        note = this.web3.utils.toHex(note);

        return new Promise((resolve, reject) => {
            let weiValue = this.web3.utils.toWei(value);
            let clawback = this.getInstance().methods.clawback(from, to, weiValue, note);
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
     * CAT-20 burn function
     * @param {integer} value Numbet of the tokens to burn
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    burn(value, sendFrom) {
        if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
        if (value == 0) throw new Error("An invalid number of the tokens to send.");

        return new Promise((resolve, reject) => {
            let weiValue = this.web3.utils.toWei(value);
            let burn = this.getInstance().methods.burn(weiValue);
            let message = `
                    Burning ${value} ${this.symbol}.
                    From:   ${sendFrom}
                    Please wait...
                `;

            action
            .setAction(burn)
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
     * CAT-20 pause function
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    pause(sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

            let pause = this.getInstance().methods.pause();
            let message = `Set ${this.symbol} token on pause. Please wait...`;

            action
            .setAction(pause)
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
     * CAT-20 unpause function
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    unpause(sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

            let pause = this.getInstance().methods.unpause();
            let message = `Unpause ${this.symbol} token. Please wait...`;

            action
            .setAction(pause)
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
     * CAT-20 toggleRollbacksStatus function
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    toggleRollbacksStatus(sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

            let toogle = this.getInstance().methods.toggleRollbacksStatus();
            let message = `Toggle rollbacks status. Please wait...`;

            action
            .setAction(toogle)
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
     * CAT-20 createRollbackTransaction function
     * @param {string} txHash Transaction for rollback
     * @param {string} sendFrom Account from which will be executed transaction
     * @public
     */
    createRollbackTransaction(txHash, sendFrom) {
        return new Promise((resolve, reject) => {
            this.getTransactionReceipt(txHash)
            .then(receipt => {
                if (!receipt || typeof receipt.logs[1] == 'undefined' || typeof receipt.logs[0] == 'undefined') {
                    reject("Invalid transaction. Rollback is not supported.");
                }
                let checkpointId = parseInt(receipt.logs[1].topics[2]);
                let txFrom = this.prepareAddressFromLog(receipt.logs[0].topics[1]);
                let to = this.prepareAddressFromLog(receipt.logs[0].topics[2]);
                let value = parseInt(receipt.logs[0].data);

                if (!checkpointId || !txFrom || !to || !value) {
                    reject("Invalid transaction. Rollback is not supported.");
                }

                let rollback = this.getInstance()
                    .methods
                    .createRollbackTransaction(to, txFrom, txFrom, value, checkpointId, txHash);
                    
                let message = `
                    Create rollback transaction
                    To: ${to}
                    From: ${txFrom},
                    Value: ${this.web3.utils.fromWei(value.toString(), "ether")},
                    CheckpointId: ${checkpointId},
                    txHash: ${txHash}
                `;

                action
                .setAction(rollback)
                .execute(sendFrom, this.web3, message)
                .then(receipt => {
                    resolve(receipt);
                })
                .catch(error => {
                    reject(error);
                });
            })
            .catch(error => {
                reject(error);
            });
        })
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

    /**
     * CAT-20 move tokens to escrow
     * @param {string} holder Account for which token will move to escrow
     * @param {string} escrow Escrow agent address (must be registered in the application registry)
     * @param {integer} value Number of the tokens which will be held
     * @param {string} sendFrom Account from which will be executed transaction
     * @param {string} data Additional data (maybe reason)
     */
    createEscrow(holder, escrow, value, dataForCall, data, externalId, canCancel, call, sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(holder)) throw new Error("Invalid account address.");
            if (!this.web3.utils.isAddress(escrow)) throw new Error("Invalid escrow address.");
            if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");
            if (value <= 0) throw new Error("An invalid number of the tokens.");

            let weiValue = this.web3.utils.toWei(value);
            let hexData = this.web3.utils.toHex(data);
            let hexDataForCall = this.web3.utils.toHex(dataForCall);
            let hexId = this.web3.utils.toHex(externalId);

            let toEscrow = this.getInstance().methods.createEscrow(
                holder,
                escrow,
                weiValue,
                hexDataForCall,
                hexData,
                hexId,
                canCancel,
                call    
            );
            let message = `Move ${value} ${this.symbol} tokens to escrow. Please wait...`;

            action
            .setAction(toEscrow)
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
     * CAT-20 move tokens to escrow
     */
    cancelEscrow(escrowId, dataForCall, data, sendFrom) {
        return new Promise((resolve, reject) => {
            if (!this.web3.utils.isAddress(sendFrom)) throw new Error("Invalid sender address.");

            let hexData = this.web3.utils.toHex(data);
            let hexDataForCall = this.web3.utils.toHex(dataForCall);
            let hexId = this.web3.utils.toHex(escrowId);

            let cancelEsc = this.getInstance().methods.cancelEscrow(
                hexId,
                hexDataForCall,
                hexData
            );
            let message = `Cancel escrow ${escrowId}. Please wait...`;

            action
            .setAction(cancelEsc)
            .execute(sendFrom, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    getEscrowById(escrowId) {
        return new Promise((resolve, reject) => {
            this.getInstance().methods.getEscrowById(escrowId).call({}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }
}

module.exports = new CAT20();