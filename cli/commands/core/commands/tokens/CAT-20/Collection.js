const Transfer = require("./TransferCommand");
const BalanceOf = require("./BalanceOfCommand");
const Clawback = require("./ClawbackCommand");
const TokenDistribution = require("./TokenDistribution");
const CommandsCollection = require("../../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the CAT-20 token
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
            new Transfer(),
            new TokenDistribution(),
            new BalanceOf(),
            new Clawback(),
        ];
    }
}

module.exports = new Collection();