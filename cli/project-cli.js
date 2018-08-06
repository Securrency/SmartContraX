#!/usr/bin/env node

var program = require('commander');

var tokensGenerator = require('./commands/tokensGenerator.js');
var tokenInteraction = require('./commands/tokenInteraction.js');

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
  .action(async function() {
    tokenInteraction.run();
  });

program.parse(process.argv);