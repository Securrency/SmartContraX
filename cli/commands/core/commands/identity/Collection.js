const setWalletAttribute = require("./SetWalletAttributeCommand");
const getWalletAttribute = require("./GetWalletAttributeCommand");
const deleteWalletAttribute = require("./DeleteWalletAttributeCommand");
const CommandsCollection = require("../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the Identity
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
            new setWalletAttribute(),
            new getWalletAttribute(),
            new deleteWalletAttribute(),
        ];
    }
}

module.exports = new Collection();