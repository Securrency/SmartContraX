const CommandsCollection = require("../CommandsCollection");
const AddArrayToWhiteList = require("./AddArrayToWhiteListCommand");
const RemoveArrayFromWhiteList = require("./RemoveArrayFromWhiteListCommand");
const PresentInWhiteList = require("./PresentInWhiteListCommand");


/**
 * @fileoverview Initialize all commands that are related to the WhiteList
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
            new AddArrayToWhiteList(),
            new PresentInWhiteList(),
            new RemoveArrayFromWhiteList(),
        ];
    }
}

module.exports = new Collection();