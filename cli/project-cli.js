#!/usr/bin/env node

var program = require('commander');

var tokensGenerator = require('./commands/tokensGenerator.js');
var tokenInteraction = require('./commands/tokenInteraction.js');
var symbolRegistry = require('./commands/symbolRegistry.js');
var whiteList = require('./commands/whiteList.js');
var permissionModule = require("./commands/permissionModule.js");

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
  .command('permissionMuodule')
  .alias('PM')
  .description('Functions for interaction with permission module')
  .action(() => {
    permissionModule.run();
  });

program.parse(process.argv);