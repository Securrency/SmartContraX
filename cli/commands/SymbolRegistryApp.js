const symbolRegistry = require("./core/components/SymbolRegistry"); 
const commandsCollection = require("./core/commands/symbol-registry/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provides functions for interaction with symbol registry
 * @namespace application Core applications
 */
class SymbolRegistryApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;    
            this.initializeApp(symbolRegistry);
            this.question();
        });
    }
}

module.exports = new SymbolRegistryApp();