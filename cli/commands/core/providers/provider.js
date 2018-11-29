const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");


/**
 * @fileoverview Initialize web3 provider
 * @namespace core All core component
 */
module.exports = class Provider {
    /**
     * Initialize class
     * @constructor
     * @public
     */
    constructor(url, type, seed) {
        this.http = "http"
        // Describe provider type

        this.providerUrl = url;
        this.type = type;
        this.seed = seed;
        
    }

    /**
     * Set provider url
     * @param {string} providerUrl Provider url
     * @public
     */
    setProviderUrl(providerUrl) {
        this.providerUrl = providerUrl;
        return this;
    }

    /**
     * Set provider type
     * @param {string} type Provider type (http|websockets)
     * @public
     */
    setProviderType(type) {
        if (type != this.http) {
            throw new Error("Not supported type.")
        }

        this.type = type;
        return this;
    }

    /**
     * Set seed phrase for initialization
     * @param {string} seed Wallets seed 
     * @public
     */
    setSeed(seed) {
        this.seed = seed;
        return this;
    }

    /**
     * Returns web3 instance
     * @public
     */
    getProvider() {
        let provider;
        switch (this.type) {
            case this.http:
                provider = new Web3(
                    new HDWalletProvider(
                        this.seed,
                        this.providerUrl, 
                        0,
                        10
                    )
                );
                break;
        }

        return provider;
    }
}