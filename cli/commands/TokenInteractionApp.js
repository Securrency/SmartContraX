var { createInterface } = require("readline");
var App = require("./App");
var tokensFactory = require("./core/components/TokensFactory");


/**
 * @fileoverview Provides functions for interaction with symbol registry
 * @namespace application Core applications
 */
class TokenInteractionApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            tokensFactory.initialize(this.networkId, this.web3);
            this.intitializeToken();
            this.question();
        });
        
    }

    /**
     * Requests token address and initialize contract instance
     */
    intitializeToken() {
        this.rl.question("Enter token address: ", (token) => {
            if (!this.web3.utils.isAddress(token)) {
                console.log("Invalid token address.");
                return this.intitializeToken();
            }

            tokensFactory.getTokenStandard(token, this.accounts[0])
            .then((standard) => {
                standard = this.web3.utils.toAscii(standard);
                standard = this.removeEmptyBytesFromAscii(standard);
                switch (standard) {
                    case "ERC-20":
                    case "CAT-20":
                        let CAT20Token = require("./core/components/tokens/CAT-20");
                        CAT20Token.address = token;
                        this.commandsCollection = require("./core/commands/tokens/CAT-20/Collection");
                        this.initializeApp(CAT20Token);
                        CAT20Token.getTokenDetails()
                        .then(() => {
                            console.log(`
                                Token name:  ${CAT20Token.tokenName}
                                Symbol:      ${CAT20Token.symbol}
                                TotalSypply: ${this.web3.utils.fromWei(CAT20Token.totalSupply, "ether")}
                            `);
                            this.question();
                        })
                        .catch(error => {
                            console.error(error);
                            this.intitializeToken();
                        });
                        break;
                    case "CAT-20-V2":
                        let CAT20TokenV2 = require("./core/components/tokens/CAT-20-V2");
                        CAT20TokenV2.address = token;
                        this.commandsCollection = require("./core/commands/tokens/CAT-20-V2/Collection");
                        this.initializeApp(CAT20TokenV2);
                        CAT20TokenV2.getTokenDetails()
                        .then(() => {
                            let totalSupply = 0;
                            if (CAT20TokenV2.totalSupply != 0) {
                                totalSupply = this.web3.utils.fromWei(CAT20TokenV2.totalSupply, "ether");
                            }
                            console.log(`
                                Token name:  ${CAT20TokenV2.tokenName}
                                Symbol:      ${CAT20TokenV2.symbol}
                                TotalSypply: ${totalSupply}
                            `);
                            this.question();
                        })
                        .catch(error => {
                            console.error(error);
                            this.intitializeToken();
                        });
                        break;
                    case "CAT-1400":
                        let CAT1400Token = require("./core/components/tokens/CAT-1400");
                        CAT1400Token.address = token;
                        this.commandsCollection = require("./core/commands/tokens/CAT-1400/Collection");
                        this.initializeApp(CAT1400Token);
                        CAT1400Token.getTokenDetails()
                        .then(() => {
                            let totalSupply = 0;
                            console.log(`
                                Token name:  ${CAT1400Token.tokenName}
                                Symbol:      ${CAT1400Token.symbol}
                                TotalSypply: ${totalSupply}
                            `);
                            this.question();
                        })
                        .catch(error => {
                            console.error(error);
                            this.intitializeToken();
                        });
                        break;
                }
            })
            .catch((error) => {
                console.error(error);
                return this.intitializeToken();
            });
        });
    }
}

module.exports = new TokenInteractionApp();