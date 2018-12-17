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