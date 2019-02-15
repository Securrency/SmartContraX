var Component = require("./Component");
var action = require("../actions/action");

/**
 * @fileoverview Containe all functions for the application registry
 * @namespace coreComponents Contains all smart contracts components
 */
class ApplicationsRegistry extends Component {
    /**
     * Initialize component details
     * @constructor
     * @public
     */
    constructor() {
        super();
        this.name = "ApplicationRegistry";
    }

    /**
     * Check appliction in the registry
     * @param {string} app Application to be verified
     * @param {string} token Token address
     * @param {string} from Account from which transaction will be sent
     * @public
     */
    isRegisteredApp(app, token, from) {
        if (!this.web3.utils.isAddress(app)) throw new Error("Invalid application for verification.");
        if (!this.web3.utils.isAddress(token)) throw new Error("Invalid token address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            this.getInstance().methods.isRegisteredApp(app, token).call({from: from}, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * Register application in the CAT registry
     * @param {string} app Application to be registred in the CAT registry
     * @param {string} from Account from which transaction will be sent
     * @public
     */
    createCATApp(app, from) {
        if (!this.web3.utils.isAddress(app)) throw new Error("Invalid application address.");
        if (!this.web3.utils.isAddress(from)) throw new Error("Invalid sender address.");

        return new Promise((resolve, reject) => {
            let cCATApp = this.getInstance().methods.createCATApp(app);

            let message = `Register ${app} application. Please wait...`;

            action
            .setAction(cCATApp)
            .execute(from, this.web3, message)
            .then(receipt => {
                resolve(receipt);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = new ApplicationsRegistry();