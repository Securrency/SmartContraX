const AddRoleForTheToken = require("./AddRoleForTheTokenCommand")
const AddRoleForTheTokenByTranche = require("./AddRoleForTheTokenByTrancheCommand")
const CommandsCollection = require("../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the Permission module
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
            new AddRoleForTheToken(),
            new AddRoleForTheTokenByTranche(),
        ];
    }
}

module.exports = new Collection();