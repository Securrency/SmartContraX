const Transfer = require("./TransferCommand");
const Clawback = require("./ClawbackCommand");
const Mint = require("./MintCommand");
const BalanceOf = require("./BalanceOfCommand");
const InitializeToken = require("./InitializeTokenCommand");
const SetImplementations = require("./SetImplementationsCommand");
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
            new Clawback(),
            new Mint(),
            new Transfer(),
            new BalanceOf(),
            new InitializeToken(),
            new SetImplementations(),
        ];
    }
}

module.exports = new Collection();