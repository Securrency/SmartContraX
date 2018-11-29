var customProvider = require("./provider");
var seed = require("../seed");
var config = require("./config");


/**
 * @fileoverview Provides main functions for web3 provider selection
 * @namespace core All core component
 */
class ProvidersFactory {
    /**
     * Initialize supported providers
     * @constructor
     * @public
     */
    constructor() {
        this.defaultNetwork = "localhost";
    }

    /**
     * Select provider
     * @param {string} name Provider name
     * @public
     */
    getProvider(name) {
        if (name == "") {
            name = this.defaultNetwork;
        }
        let providerData = config[name];
        if (providerData == "undefined") {
            throw new Error("Provider not found.");
        }

        let provider = new customProvider(
            providerData.url,
            providerData.type,
            seed.get()
        );
        
        return provider.getProvider();
    }
}

module.exports = new ProvidersFactory();