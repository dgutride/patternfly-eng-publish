#!/usr/bin/env node
'use strict';

const Deployment = require('../lib/ghpages/Deployment'),
      TravisEnvironment = require('../lib/ghpages/TravisEnvironment'),
      fs = require('fs-promise'),
      inquirer = require('inquirer'),
      yargs = require('yargs'),
      _ = require('lodash'),
      exec = require('mz/child_process').exec;

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
  let initPromise = argv.travis ? new TravisEnvironment() : Promise.resolve();
  return initPromise
  .then(() => deployment.init())
  .then(() => deployment.deploy())
  .catch(err => console.error(err.stack || err));
}

function getRepoChoices() {
  return exec('git remote -v')
  .then(function(output) {
    let remotes = output[0].split('\n')
    .filter(function(lines) {
      return lines.length;
    })
    .map(function(line) {
      let words = line.split(/[\s,\t]+/);
      return {
        name: `${words[0]} (${words[1]})`,
        value: words[0],
        type: words[2].replace(/[(,)]+/g, '')
      }
    }).filter(function(remote) {
      return remote.type === 'push';
    });
    return remotes;
  })
};

function getFolderChoices() {
  const blacklist = ['.git', 'node_modules'];
  return fs.readdir('./')
  .then(files => {
    let promises = [];
    files.forEach(function(file) {
      promises.push(fs.stat(file)
      .then(stat => {
        return stat.isDirectory() ? file : null;
      }));
    })
    return Promise.all(promises)
    .then(files => {
      return files.filter(file => {
        return file !== null && blacklist.indexOf(file) < 0;
      });
    })
  });
}

function inquireMissingOptions(options) {
  try {
    let packageJson = require(process.cwd() + '/package.json');
    if (packageJson && packageJson.patternfly && packageJson.patternfly.publish) {
      options = _.merge(options, packageJson.patternfly.publish);
    }
  } catch(err) {
    console.error(err.stack || err);
  }
  if (argv.travis) {
    return promise.resolve(options);
  } else {
    return Promise.resolve(options)
    .then(options => options.repoName ? options : inquireMissingRepo(options))
    .then(options => options.siteFolder ? options : inquireMissingFolder(options))
  }
};

function inquireMissingFolder(options) {
  return getFolderChoices()
  .then(choices => {
    choices.push({
      name: 'Other',
      value: ''
    });
    return inquirer.prompt([{
      type: 'rawlist',
      name: 'folder',
      message: 'Which folder do you want to publish?',
      choices: choices,
      default: 0
    }]);
  })
  .then(function (answers) {
    if (! answers.folder) {
      return inquirer.prompt([{
        type: 'string',
        name: 'folder',
        message: 'Please provide the folder name'
      }]);
    } else {
      return answers;
    }
  })
  .then(function(answers) {
    options.siteFolder = answers.folder;
    return options;
  });
}


function inquireMissingRepo(options) {
  return getRepoChoices()
  .then(choices => {
    choices.push({
      name: 'Other',
      value: ''
    });
    return exec('git for-each-ref --format=\'%(upstream:short)\' $(git symbolic-ref -q HEAD)')
    .then(output => output[0].split('\n')[0].split('/')[0] || false)
    .catch(err => '')
    .then(tracking => {
      let _default = choices.findIndex(choice => {
        return choice.value === tracking;
      })
      return inquirer.prompt([{
        type: 'rawlist',
        name: 'repo',
        default: _default,
        message: 'To which repository do you want to publish?',
        choices: choices,
      }]);
    });
  })
  .then(function (answers) {
    if (! answers.repo) {
      return inquirer.prompt([{
        type: 'string',
        name: 'repo',
        message: 'Please provide the git repo url'
      }]);
    } else {
      return answers;
    }
  })
  .then(function(answers) {
    options.repoName = answers.repo;
    return options;
  });
}

function main() {
  // Command options are present in: argv
  let options = {
    siteFolder: argv._[0],
    repoName: argv.repo,
    pushBranch: argv.branch,
    filterBowerFiles: argv.web
  };
  inquireMissingOptions(options)
  .then(function() {
    return deploy(options);
  }, function(err) {
    console.error(err.stack || err);
  });
}

main();