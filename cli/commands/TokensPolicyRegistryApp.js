const policyRegsitry = require("./core/components/TokensPolicyRegistry"); 
const commandsCollection = require("./core/commands/tokens-policy-registry/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provides functions for interaction with tokens policy registry
 * @namespace application Core applications
 */
class TokensPolicyRegistryApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;
            this.initializeApp(policyRegsitry);
            this.question();
        }); 
    }
}

module.exports = new TokensPolicyRegistryApp();