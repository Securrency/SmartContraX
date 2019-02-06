#!/usr/bin/env node

var program = require('commander');

var tokensGenerator = require('./commands/tokensGenerator.js');
var tokenInteraction = require('./commands/tokenInteraction.js');
var symbolRegistry = require('./commands/symbolRegistry.js');
var whiteList = require('./commands/whiteList.js');
var permissionModule = require("./commands/permissionModule.js");
var crossChainListener = require("./commands/crossChainListener.js");
var applicationRegistry = require("./commands/ApplicationsRegistryApp.js");
var identity = require("./commands/IdentityApp.js");
var tokensPolicyRegistryApp = require("./commands/TokensPolicyRegistryApp.js");

program
  .version('0.0.1')
  .description('CLI for tokens factory and deployed tokens with other system components');

program
  .command('tokensGenerator')
  .alias('TG')
  .description('Tokens creation and deployment')
  .action(() => {
    tokensGenerator.run();
  });

program
  .command('token')
  .alias('T')
  .description('Main functionality related with token')
  .action(() => {
    tokenInteraction.run();
  });

program
  .command('applicationRegistry')
  .alias('AR')
  .description('Application management')
  .action(() => {
    applicationRegistry.run();
  });

program
  .command('identity')
  .alias('I')
  .description('Identity')
  .action(() => {
    identity.run();
  });

program
  .command('tokensPolicyRegistry')
  .alias('TPR')
  .description('Tokens policy registry')
  .action(() => {
    tokensPolicyRegistryApp.run();
  });

program
  .command('symbolRegistry')
  .alias('SR')
  .description('Functions for interaction with symbol registry')
  .action(() => {
    symbolRegistry.run();
  });

program
  .command('whiteList')
  .alias('WL')
  .description('Functions for interaction with whitelist')
  .action(() => {
    whiteList.run();
  });

program
  .command('permissionModule')
  .alias('PM')
  .description('Functions for interaction with permission module')
  .action(() => {
    permissionModule.run();
  });

program
  .command('crossChain')
  .alias('CCL')
  .description('Listener for crosschain transfers')
  .action(() => {
    crossChainListener.run();
  });

program.parse(process.argv);