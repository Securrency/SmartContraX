const fs = require("fs");

/**
 * @fileoverview Privides methods for reading seed
 * @namespace core All core component
 */
class Seed {
    /**
     * Read seed from the file
     * @constructor
     * @public
     */
    constructor() {
        // Path to the file that stores seed
        this.file = "./cli/mnemonic";
        // stores seed phrase
        this.value = fs.readFileSync(this.file).toString();

        if (this.value == "") {
            throw new Error("Invalid seed.")
        }
    }

    /**
     * Returns seed
     * @public
     */
    get() {
        return this.value;
    }
}

module.exports = new Seed();