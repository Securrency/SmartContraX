const permissionModule = require("./core/components/PermissionModule"); 
const commandsCollection = require("./core/commands/permission-module/Collection");

var { createInterface } = require("readline");
var App = require("./App");


/**
 * @fileoverview Provides functions for interaction with permission module
 * @namespace application Core applications
 */
class PermissionModuleApp extends App {
    async run() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeNetwork()
        .then(() => {
            this.commandsCollection = commandsCollection;
            this.initializeApp(permissionModule);
            this.question();
        }); 
    }
}

module.exports = new PermissionModuleApp();