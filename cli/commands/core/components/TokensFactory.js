var Component = require("./Component");
var action = require("../actions/action");

/**
 * @fileoverview Containe all functions for the Tokens Factory initialization
 * @namespace coreComponents Contains all smart contracts components
 */
class TokensFactory extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "TokensFactory";
    }

    /**
     * Create new token
     * @param {string} tokenName Name of the new token
     * @param {string} symbol Token symbol
     * @param {integer} decimals Token decimals
     * @param {integer} totalSupply Number of the tokens that will be created
     * @param {string} tokenStandard Token standard (CAT-20,CAT-721,ERC-20....)
     * @param {string} issuer Issuer account
     * @public
     */
    createToken(
        tokenName, 
        tokenSymbol, 
        decimals,
        totalSupply,
        tokenStandard,
        issuer
    ) {
        if (!tokenName) throw new Error("Invalid token name.");
        if (tokenSymbol.length < 1 || tokenSymbol.length > 5) throw new Error("Symbol length must be beetwen 1 & 5.");
        if (decimals < 1 && decimals > 18) throw new Error("Invalid decimals. Must be beetwen 1 & 18.");
        if (!tokenStandard) throw new Error("Invalid token standard.");
        if (!this.web3.utils.isAddress(issuer)) throw new Error("Invalid issuer address.");

        return new Promise((resolve, reject) => {
            let createToken = this.getInstance().methods.createToken(
                tokenName, 
                tokenSymbol, 
                decimals,
                totalSupply,
                tokenStandard
            );
    
            let message = `Creating ${tokenSymbol} token. Please wait...`;
    
            action
            .setAction(createToken)
            .execute(issuer, this.web3, message)
            .then(receipt => {
                let tokenAddress = receipt.events['2'].raw.topics[1];
                if (this.tokenStandard != '0x4341542d373231') {
                    tokenAddress = receipt.events['3'].raw.topics[1];
                }
    
                tokenAddress = tokenAddress.replace("000000000000000000000000", "");

                resolve(tokenAddress);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Get token standard by token address
     * @param {string} token Token address
     * @public
     */
    getTokenStandard(token, from) {
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            this.getInstance().methods.getTokenStandard(token).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }
    
    /**
     * Update tokens deployment strategy 
     * @param {string} standard Token standard (CAT-20, CAT-721, CAT-1400...)
     * @param {string} strategy Deployment strategy address
     * @param {string} sendFrom Account from which will be executed transaction
     */
    updateTokenStrategy(standard, strategy, sendFrom) {
        return new Promise((resolve, reject) => {
            let hexStandard = this.web3.utils.toHex(standard);
            let update = this.getInstance().methods.updateTokenStrategy(hexStandard, strategy);

            let message = `Update deployment strategy for ${standard}. Please wait...`;

            action
            .setAction(update)
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

module.exports = new TokensFactory();