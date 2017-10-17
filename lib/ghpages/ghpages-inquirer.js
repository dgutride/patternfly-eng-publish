'use strict';

const fs = require('fs-promise'),
      inquirer = require('inquirer'),
      _ = require('lodash'),
      exec = require('mz/child_process').exec,
      packageJson = require(process.cwd() + '/package.json');

class GhpagesInquirer {
  getRepoChoices() {
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
  }

  getFolderChoices() {
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

  inquireMissingOptions(options) {
    try {
      if (packageJson && packageJson.patternfly && packageJson.patternfly.publish) {
        options = _.defaults(options, packageJson.patternfly.publish);
      }
    } catch(err) {
      console.error(err.stack || err);
    }
    if (options.travis) {
      return Promise.resolve(options);
    } else {
      return Promise.resolve(options)
      .then(options => options.repoName ? options : this.inquireMissingRepo(options))
      .then(options => options.siteFolder ? options : this.inquireMissingFolder(options))
    }
  }

  inquireMissingFolder(options) {
    return this.getFolderChoices()
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

  inquireMissingRepo(options) {
    return this.getRepoChoices()
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
}

module.exports = GhpagesInquirer;