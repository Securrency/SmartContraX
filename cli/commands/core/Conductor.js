/**
 * @fileoverview Execute commands
 * @namespace core All core component
 */
class Conductor {
    /** 
     * Execute provided command
     * @param {Command} command Command that will be executed 
     * @public
     */
    run(command) {
        return new Promise((resolve, reject) => {
            command.execute()
            .then((result) => { 
                resolve(result)
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = new Conductor();