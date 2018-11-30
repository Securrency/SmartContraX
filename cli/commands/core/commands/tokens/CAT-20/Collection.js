const Transfer = require("./TransferCommand");
const BalanceOf = require("./BalanceOfCommand");
const Clawback = require("./ClawbackCommand");
const Mint = require("./MintCommand");
const Burn = require("./BurnCommand");
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
            new Mint(),
            new Burn(),
        ];
    }
}

module.exports = new Collection();