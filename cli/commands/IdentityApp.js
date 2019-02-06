const identity = require("./core/components/Identity"); 
const commandsCollection = require("./core/commands/identity/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provides functions for interaction with identity
 * @namespace application Core applications
 */
class IdentityApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;
            this.initializeApp(identity);
            this.question();
        }); 
    }
}

module.exports = new IdentityApp();