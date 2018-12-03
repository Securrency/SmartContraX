const createToken = require("./CreateTokenCommand");
const updateStrategy = require("./UpdateStrategyCommand");
const CommandsCollection = require("../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are Tokens factory
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
            new createToken(),
            new updateStrategy(),
        ];
    }
}

module.exports = new Collection();