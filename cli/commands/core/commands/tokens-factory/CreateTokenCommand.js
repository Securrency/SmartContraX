var readlineSync = require("readline-sync");
var Command = require("../Command");


/**
 * @fileoverview Contane command for token creation
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class CreateTokenCommand extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();

        this.name = "createToken";
        this.alias = "ct"
        this.description = "Create new token";
    }

    /**
     * Execute command
     * A user can fill token details such a token name, symbol, standard, total supply
     * and after that create new token
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.initializeDetails()
            .then(() => {
                this.contract
                .createToken(
                    this.tokenName, 
                    this.tokenSymbol, 
                    this.decimals,
                    this.totalSupply,
                    this.tokenStandard,
                    this.issuer
                )
                .then(tokenAddress => {
                    console.log(`
                    Token address: ${tokenAddress}\n`
                    );
                    resolve(tokenAddress);    
                })
                .catch(error => {
                    reject(error);
                });    
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Request token details
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            // take details
            console.log("Please fill token details\n");
            this.rl.question("--///-- Enter token name:          ", (tokenName) => {
                (tokenName == "") ? this.tokenName = "Default token name" : this.tokenName = tokenName;

                this.rl.question("--///-- Enter token symbol:        ", (tokenSymbol) => {
                    (tokenSymbol == "") ? this.tokenSymbol = "DEF" : this.tokenSymbol = tokenSymbol;

                    this.rl.question("--///-- Enter token total supply:  ", (totalSupply) => {
                        (totalSupply == "") ? this.totalSupply = 0 : this.totalSupply = totalSupply;

                        this.rl.question("--///-- Token standard:            ", (tokenStandard) => {
                            (tokenStandard == "") ? this.tokenStandard = "CAT-20" : this.tokenStandard = tokenStandard;

                            this.rl.question("--///-- Issuer:                    ", (issuer) => {
                                (issuer == '') ? this.issuer = this.accounts[0] : this.issuer = issuer;
                                if (!this.web3.utils.isAddress(this.issuer)) this.issuer = this.accounts[this.issuer];
                                this.decimals = 18;

                                this.rl.question(`
                                    Please confirm token details\n
                                    Name:           ${this.tokenName}
                                    Symbol:         ${this.tokenSymbol}
                                    Decimals:       ${this.decimals}
                                    Total supply:   ${this.totalSupply}
                                    Token standard: ${this.tokenStandard}
                                    Issuer:         ${this.issuer}

                                    \n
                                    Press enter || (Y/N) to continue:
                                `, (confirm) => {
                                    if (confirm != "") reject("Token details not confirmed.");

                                    // convert inputs
                                    this.tokenStandard = this.web3.utils.toHex(this.tokenStandard);
                                    this.totalSupply = this.web3.utils.toWei(this.totalSupply.toString(), "ether");

                                    resolve();
                                });
                            });
                        });
                    });
                });
            })
        });        
    }
}