/**
 * @fileoverview Privdes main methods for component commands
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CommandsCollection {
    /**
     * Print list of all supported commands
     * @public
     */
    printListOfAllCommands() {
        if (this.commands.legth === 0) {
            console.log("No active commands.");
            return;
        }

        let c;
        let result = "";
        for (let i = 0; i < this.commands.legth; i++) {
            c = this.commands[i];
            result += ` --${c.name} (--${c.alias}) - ${c.description}`;
        }

        console.log(result);
    }

    /**
     * Returns command by specified name or alias
     * @param {string} command Name or alias of the command
     * @public
     */
    getCommand(command) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < this.commands.length; i++) {
                if (this.commands[i].name === command || this.commands[i].alias === command) {
                    resolve(this.commands[i]);
                }
            }
            reject("Command not found.");
        });
    }
}