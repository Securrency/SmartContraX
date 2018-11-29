const csv = require('csvtojson')
const fs = require('fs');

var Command = require("../../Command");
var WhiteList = require("../../../components/WhiteList");


/**
 * @fileoverview Contains command for CAT-20 tokens transfer
 * @namespace coreCommands Smart contracts related commands
 */
module.exports = class TokenDistribution extends Command {
    /**
     * Initialize command
     * @constructor
     * @public
     */
    constructor() {
        super();
        
        this.name = "tokenDistribution";
        this.alias = "td"
        this.description = "Distribute tokens from specified file";
    }

    /**
     * Execute command
     * @public
     */
    execute() {
        return new Promise((resolve, reject) => {
            this.initializeDetails()
            .then(() => {
                csv()
                .fromFile(this.filePath)
                .then((jsonObj)=>{
                    let investors = [];
                    for (let i = 0; i < jsonObj.length; i++) {
                        console.log(`${i+1}. ${jsonObj[i].Investor} - ${jsonObj[i].Tokens}`);
                        investors.push(jsonObj[i].Investor);
                    }

                    this.rl.question("Confirm distribution (Y/N): ", (answer) => {
                        if (answer == "N" || answer == "n") return reject("Distribution canceled.");
                        
                        WhiteList.initialize(this.networkId, this.web3);

                        this.addInvestorsToTheWhitelist(investors)
                        .then(() => {
                            this.distribute(jsonObj, 0)
                            .then(() => {
                                console.log("Distribution complete.");
                                resolve();
                            })
                            .catch(error => {
                                reject(error);
                            });
                        })
                        .catch(error => {
                            reject(error);
                        });
                    });
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
     * Send tokens to the investors
     * @param {object} data Information about investors for the distribution
     */
    distribute(data, index) {
        return new Promise((resolve, reject) => {
            if (data.length == index) {
                resolve();
            }
            this.contract
            .transfer(
                data[index].Investor,
                data[index].Tokens,
                this.distributor
            ).then((result) => {
                this.distribute(data, index+1)
                .then(() => {
                    resolve();
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
     * Add selected investors to the whitelist
     * @param {array} investors Array of the investors that will be added to the whitelist
     * @private
     */
    addInvestorsToTheWhitelist(investors) {
        return new Promise((resolve, reject) => {
            WhiteList
            .addArrayToWhiteList(
                investors,
                this.contract.address,
                this.distributor
            ).then((result) => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Request account & symbol
     * @private
     */
    initializeDetails() {
        return new Promise((resolve, reject) => {
            this.rl.question("File with accounts for distribution: ", (path) => {
                path = process.cwd()+"/cli/commands/tmp/"+path;
                if (!fs.existsSync(path)) return reject("File not found.");
                this.filePath = path;
                this.rl.question("Distributor account: ", (account) => {
                    this.distributor = account;
                    if (!this.web3.utils.isAddress(account)) {
                        this.distributor = this.accounts[account];
                    }
                    if (!this.web3.utils.isAddress(this.distributor)) return reject("Invalid distributor address.");
                    resolve();
                });
            });
        }); 
    }
}