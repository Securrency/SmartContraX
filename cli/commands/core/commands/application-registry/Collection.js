const isRegistredApp = require("./IsRegistredAppCommand");
const createCATApp = require("./CreateCATAppCommand");
const CommandsCollection = require("../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the Appliction Registry
 * @namespace coreCommands Smart contracts related commands
 */
class Collection extends CommandsCollection {
    /**
     * Initialize all commands
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.commands = [
            new isRegistredApp(),
            new createCATApp(),
        ];
    }
}

module.exports = new Collection();