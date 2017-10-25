#!/usr/bin/env node
'use strict';

const Deployment = require('../lib/ghpages/deployment'),
      TravisEnvironment = require('../lib/ghpages/travis-environment'),
      GhpagesInquirer = require('../lib/ghpages/options-inquirer'),
      colors = require('colors');

function deploy(options) {
  let deployment = new Deployment(options);
  let initPromise = argv.travis ? new TravisEnvironment().init() : Promise.resolve();
  return initPromise
  .then(() => deployment.init())
  .then(() => deployment.deploy())
  .catch(err => console.error(colors.red(err.stack || err)));
}

function main() {
  // Command options are present in: argv
  let ghpagesInquirer = new GhpagesInquirer();
  ghpagesInquirer.inquireMissingOptions()
  .then(function(options) {
    return deploy(options);
  }, function(err) {
    console.error(err.stack || err);
  });
}

main();
