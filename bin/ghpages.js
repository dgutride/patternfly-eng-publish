#!/usr/bin/env node
'use strict';

const Deployment = require('../lib/ghpages/deployment'),
      TravisEnvironment = require('../lib/ghpages/travis-environment'),
      GhpagesInquirer = require('./ghpages-inquirer'),
      yargs = require('yargs');

const argv = yargs
    .usage('Usage: $0 [options] <folder> \nThis script will publish files to a remote branch of your repo.')
    .example('$0 -b gh-pages -r bleathem -f public', 'Publish the public folder to the gh-pages branch of the bleathem repository')

    .alias('r', 'repo')
    .nargs('r', 1)
    // .default('r', 'origin')
    .describe('r', 'Git repo this script will publish to eg.: origin, upstream, bleathem, git@github.com:bleathem/bleathem.github.io.git')

    .alias('t', 'travis')
    .boolean('t')
    .default('t', 'false')
    .describe('t', 'Perform a deploy from travis, using a travis encrypted key')

    .alias('b', 'branch')
    .nargs('b', 1)
    .default('b', 'gh-pages')
    .describe('b', 'Remote branch this script will publish to')

    .alias('w', 'web')
    .boolean('w')
    .default('w', 'false')
    .describe('w', 'Remove non-web files from the SITE_FOLDER/components folder prior to publishing')

    .alias('f', 'foler')
    .nargs('f', 1)
    // .default('f', 'public')
    .describe('f', 'The folder to publish')

    .help('h')
    .alias('h', 'help')
    .epilog('Copyright 2017, shared under the ASLv2 license')
    .argv;

function deploy(options) {
  let deployment = new Deployment(options);
  let initPromise = argv.travis ? new TravisEnvironment().init() : Promise.resolve();
  return initPromise
  .then(() => deployment.init())
  .then(() => deployment.deploy())
  .catch(err => console.error(err.stack || err));
}

function main() {
  // Command options are present in: argv
  let options = {
    siteFolder: argv._[0],
    repoName: argv.repo,
    pushBranch: argv.branch,
    filterBowerFiles: argv.web,
    travis: argv.travis
  };
  GhpagesInquirer.inquireMissingOptions(options)
  .then(function() {
    return deploy(options);
  }, function(err) {
    console.error(err.stack || err);
  });
}

main();