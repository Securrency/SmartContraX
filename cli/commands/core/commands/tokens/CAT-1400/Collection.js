const Transfer = require("./TransferCommand");
const TransferByTranche = require("./TransferByTrancheCommand");
const Clawback = require("./ClawbackCommand");
const Mint = require("./MintCommand");
const BalanceOf = require("./BalanceOfCommand");
const BalanceOfByPartition = require("./BalanceOfByPartitionCommand");
const InitializeToken = require("./InitializeTokenCommand");
const SetImplementations = require("./SetImplementationsCommand");
const SetDefaultTranche = require("./SetDefaultTrancheCommand");
const CommandsCollection = require("../../CommandsCollection");


/**
 * @fileoverview Initialize all commands that are related to the CAT-1400 token
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
            new BalanceOfByPartition(),
            new TransferByTranche(),
            new SetDefaultTranche(),
        ];
    }
}

module.exports = new Collection();