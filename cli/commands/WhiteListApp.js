const whiteList = require("./core/components/WhiteList"); 
const commandsCollection = require("./core/commands/whitelist/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provide functions for WhiteList management
 * @namespace application Core applications
 */
class WhiteListApp extends App {
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
            this.initializeApp(whiteList);
            this.question();
        });
    }
}

module.exports = new WhiteListApp();