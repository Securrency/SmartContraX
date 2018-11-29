const isSymbolOwner = require("./IsSymbolOwnerCommand");
const IsSymbolAvailableCommand = require('./IsSymbolAvailableCommand');
const getExpirationInterval = require("./GetExpirationIntervalCommand");
const registerSymbol = require("./RegisterSymbolCommand");
const CommandsCollection = require("../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the Symbol registry
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
            new isSymbolOwner(),
            new getExpirationInterval(),
            new registerSymbol(),
            new IsSymbolAvailableCommand(),
        ];
    }
}

module.exports = new Collection();