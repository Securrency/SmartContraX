/**
 * @fileoverview Provides main functions for component initialization
 * @namespace coreComponents Contains all smart contracts components
 */
module.exports = class Component {
    /**
     * Set components details
     * @param {integer} networkId Network identifier (1 - mainnet, 3 - ropsten ...)
     * @public
     */
    initialize(networkId, web3) {
        this.web3 = web3;
        this.setDetails(this.name, networkId);
        return this;
    }

    /**
     * Set component details
     * @param {string} name Component name (must be equal to the abi file name)
     * @param {integer} networkId Network identifier (1 - mainnet, 3 - ropsten ...)
     * @public
     */
    setDetails(name, networkId) {
        this.name = name;
        this.networkId = networkId;
    }

    /**
     * Returns smart contract instance
     * @public
     */
    getInstance() {
        if (!this.instance) {
            this.readAbi().setup();
        }

        return this.instance;
    }

    /**
     * Reads component abi by the file name
     * @private
     */
    readAbi() {
        try {
            this.abi = JSON.parse(
                    require('fs')
                    .readFileSync('./build/contracts/'+this.name+'.json')
                    .toString()
                ).abi;
        } catch(error) {
            console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure that it is compiled and deployed.");
            throw new Error(error);
        }

        return this;
    }

    /**
     * Initialize smart contract instance
     * @private
     */
    setup() {
        try {
            if (!this.address) {
                this.address = JSON.parse(
                    require('fs')
                    .readFileSync('./build/contracts/'+this.name+'.json')
                    .toString()
                ).networks[this.networkId].address;
            }
            this.instance = new this.web3.eth.Contract(this.abi,this.address);
            this.instance.setProvider(this.web3.currentProvider);
        } catch (error) {
            console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
            console.log('Network id: ', this.networkId);
            throw new Error(error);
        }

        return this;
    }
}