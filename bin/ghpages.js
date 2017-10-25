#!/usr/bin/env node
'use strict';

/**
This script parses command line options, and optionally queries the user for
missing options via the `options-inquirer` class.  It then instantiates a
Deployment class instance to execute the deployment using the provided options.

Refer to the class comments for further details.
*/

const Deployment = require('../lib/deploy/deployment'),
      TravisEnvironment = require('../lib/travis-environment'),
      GhpagesInquirer = require('../lib/options-inquirer'),
      colors = require('colors');

function deploy(options) {
  let deployment = new Deployment(options);
  let initPromise = options.travis ? new TravisEnvironment().init() : Promise.resolve();
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
