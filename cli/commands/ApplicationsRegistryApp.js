const applictionsRegistry = require("./core/components/ApplicationsRegistry"); 
const commandsCollection = require("./core/commands/application-registry/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provides functions for interaction with application registry
 * @namespace application Core applications
 */
class ApplicationsRegistryApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;
            this.initializeApp(applictionsRegistry);
            this.question();
        }); 
    }
}

module.exports = new ApplicationsRegistryApp();