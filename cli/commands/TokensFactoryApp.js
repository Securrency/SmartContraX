const tokensFactory = require("./core/components/TokensFactory"); 
const commandsCollection = require("./core/commands/tokens-factory/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provide functions for token creation and other Tokens factory methods
 * @namespace application Core applications
 */
class TokensGeneratorApp extends App {
    /**
     * Run application.
     * @public
     */
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;
            this.initializeApp(tokensFactory);
            this.question();
        });
    }
}

module.exports = new TokensGeneratorApp();