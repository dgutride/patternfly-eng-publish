#!/usr/bin/env node
'use strict';

const Deployment = require('../lib/ghpages/Deployment'),
      TravisEnvironment = require('../lib/ghpages/TravisEnvironment')

const argv = require('yargs')
    .usage('Usage: $0 [options] <folder> \nThis script will publish files to the ${PUSH_BRANCH} branch of your repo.')
    .command('folder', 'Publish the site to github pages')
    .example('$0 publish -r bleathem public', 'Publish the public folder to the bleathem repository')

    .alias('r', 'repo')
    .nargs('r', 1)
    .default('r', 'origin')
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
    .demandOption(['r'])
    .demandCommand(1)
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright 2017, shared under the ASLv2 license')
    .argv;

function main() {
  // Command options are present in: argv
  let deployment = new Deployment({
    siteFolder: argv._[0],
    repoName: argv.repo,
    pushBranch: argv.branch,
    filterBowerFiles: argv.web
  });
  let promise = argv.travis
    ? new TravisEnvironment()
    : Promise.resolve();
  promise
  .then(() => deployment.init())
  .then(() => deployment.deploy())
  .catch(err => console.error(err.stack || err));
}

main();