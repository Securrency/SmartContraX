#!/usr/bin/env node

var program = require('commander');

var tokensGenerator = require('./commands/tokensGenerator.js');

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

program.parse(process.argv);