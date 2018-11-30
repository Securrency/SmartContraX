/**
 * @fileoverview All methods related to the action execution
 * @namespace coreActions All core component
 */
class Action {
    /**
     * Set new action
     * @param {object} action Action that will be executed
     * @public
     */
    setAction(action) {
        if (!action) throw new Error("Invalid action.");
        
        this.action = action;
        return this;
    }

    /**
     * Estimate gas for the action
     * @param {string} account Account from which transaction will be sent
     * @public
     */
    estimateGas(account) {
        if (!this.action) throw new Error("Invalid action.");
        if (!account) throw new Error("Invalid sender account.");

        return new Promise((resolve, reject) => {
            this.action.estimateGas({ from: account }, (error, result) => {
                if (error) {
                    console.error(`Gas price estimation failed.`);
                    reject(error);
                }
                this.gas = Math.round(1.7 * result);
                resolve(this.gas);
            });
        });
    }

    /**
     * Estimate gas price
     * @public
     */
    estimateGasPrice(web3) {
        if (!this.action) throw new Error("Invalid action.");
        if (!web3) throw new Error("Invalid web3 instance.");

        return new Promise((resolve, reject) => {
            web3.eth.getGasPrice((error, result) => {
                if (error) {
                    reject(error);
                }
                this.gasPrice = result;
                resolve(result);
            })
        })
    }

    /**
     * Execute action
     * @param {string} sender Transaction initiator address
     * @param {object} web3 Web3 provider
     * @param {string} message Custom message
     * @public
     */
    execute(sender, web3, message) {
        return new Promise((resolve, reject) => {
            this
            .estimateGas(sender)
            .then(() => {
                this.estimateGasPrice(web3)
                .then(() => {
                    this.sendTx(sender, message)
                    .then(result => {
                        resolve(result);
                    }).catch(error => {
                        reject(error);
                    });               
                }).catch(error => {
                    reject(error);
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Send transaction
     * @param {string} sender Transaction initiator address
     * @param {string} message Custom message
     * @private
     */
    sendTx(sender, message) {
        return new Promise((resolve, reject) => {
            this.action.send({ from:sender, gas:this.gas, gasPrice:this.gasPrice})
            .on('transactionHash', (hash) => {
                console.log(`
                    ${message}
                    TxHash: ${hash}`
                );
            })
            .on('receipt', (receipt) => {
                console.log(`
                    Congratulations! The transaction was successfully completed.
                `);
                resolve(receipt);
            })
            .on('error', (error) => {
                console.error("Trasaction failed!");
                reject(error);
            });
        });
    }
}

module.exports = new Action();