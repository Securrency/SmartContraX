#!/usr/bin/env node

var program = require('commander');

var permissionMatrix = require('./commands/permissionMatrixSetup.js');

program
  .version('0.0.1')
  .description('Commands for the network configuring');

program
  .command('permissionMatrixSetup')
  .alias('PMS')
  .description('Configure permission matrix')
  .action(() => {
    permissionMatrix.run();
  });

program.parse(process.argv);