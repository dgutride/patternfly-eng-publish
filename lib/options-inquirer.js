'use strict';

const fs = require('fs-promise'),
      path = require('path'),
      SiteRepo = require('./deploy/site-repo'),
      inquirer = require('inquirer'),
      _ = require('lodash'),
      packageJson = require(process.cwd() + '/package.json'),
      yaml = require('js-yaml'),
      yargs = require('yargs'),
      colors = require('colors'),
      spawnPromise = require('spawn-rx').spawnPromise;

class GhpagesInquirer {
  constructor() {
    let argv = yargs
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

      .alias('s', 'subfolder')
      .nargs('s', 1)
      .default('s', '')
      .describe('s', 'The name of this stage, used in building the URL.  Leave empty for a root deployment')

      .help('h')
      .alias('h', 'help')
      .epilog('Copyright 2017, shared under the ASLv2 license')
      .argv;

    this.options = {
      siteBuild: argv._[0],
      subfolder: argv.subfolder,
      repoName: argv.repo,
      pushBranch: argv.branch,
      travis: argv.travis
    };

    try {
      if (packageJson && packageJson.patternfly && packageJson.patternfly.publish) {
        this.options = _.defaults(this.options, packageJson.patternfly.publish);
      }
    } catch(err) {
      console.error(err.stack || err);
    }
  }

  static optionsToString(options) {
    return `-r ${options.repoName} -t ${options.travis} -b ${options.branch} -s ${options.subfolder} ${options.siteBuild}`
  }

  getRepoChoices() {
    return spawnPromise('git', ['remote', '-v'])
    .then(function(output) {
      let remotes = output.split('\n')
      .filter(function(lines) {
        return !!lines.length;
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

  getStageChoices(options) {
    return spawnPromise('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
    .then(output => {
      const branch = output.split('\n')[0];
      return ['', branch, ];
    })
    .then(folders => {
      const jekyllConfig = '_build/_config.yml';
      return fs.exists(jekyllConfig)
        .then(exists => {
          if (exists) {
            return fs.readFile(jekyllConfig)
              .then(contents => {
                const config = yaml.safeLoad(contents);
                const siteRepo = new SiteRepo(options.repoName);
                return (siteRepo.inferRepo())
                  .then(() => {
                    console.log(siteRepo.pushRepoName)
                    if (config.baseurl.startsWith('/' + siteRepo.pushRepoName)) {
                      return config.baseurl.split('/').slice(2).join('/');
                    } else {
                      return config.baseurl;
                    }
                  })
              })
              .then(baseurl => {
                if (baseurl) {
                  folders.unshift(baseurl);
                }
                return folders;
              })
          } else {
            return folders;
          }
        });
    });
  }

  inquireMissingOptions() {
    if (this.options.travis) {
      return Promise.resolve(this.options);
    } else {
      return Promise.resolve(this.options)
      .then(options => options.repoName ? options : this.inquireMissingRepo(options))
      .then(options => options.siteBuild ? options : this.inquireMissingFolder(options))
      .then(options => options.subfolder ? options : this.inquireStageName(options))
      .then(options => {
        this.options = options;
        return this.options;
      })
    }
  }

  inquireMissingFolder(options) {
    return this.getFolderChoices()
    .then(choices => {
      choices.push({
        name: 'Other',
        value: ''
      });
      let _default = 0;
      if (options.siteFolder) {
        _default = choices.indexOf(options.siteFolder);
        if (_default < 0) {
          _default = 0;
        }
      }
      return inquirer.prompt([{
        type: 'rawlist',
        name: 'folder',
        pageSize: choices.length + 1,
        message: 'Which folder do you want to publish?',
        choices: choices,
        default: _default
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
      options.siteBuild = answers.folder;
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
      return spawnPromise('git', ['symbolic-ref', '-q', 'HEAD'])
      .then (ref => ref.split('\n')[0])
      .then (ref => spawnPromise('git', ['for-each-ref', '--format=%\(upstream:short\)', ref]))
      .then(output => output.split('/')[0] || false)
      .catch(err => '')
      .then(tracking => {
        let _default = choices.findIndex(choice => {
          return choice.value === tracking;
        })
        return inquirer.prompt([{
          type: 'rawlist',
          name: 'repo',
          pageSize: choices.length + 1,
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

  inquireStageName(options) {
    return this.getStageChoices(options)
    .then(choices => {
      choices.push({
        name: 'Other',
        value: -1
      });
      return inquirer.prompt([{
        type: 'rawlist',
        name: 'subfolder',
        pageSize: choices.length + 1,
        default: 0,
        message: 'Select the name for this stage (blank for a root deployment)',
        choices: choices,
      }]);
    })
    .then(answers => {
      if (answers.subfolder === -1) {
        return inquirer.prompt([{
          type: 'string',
          name: 'subfolder',
          default: null,
          message: 'Provide a name for this stage (leave blank for a root deployment)'
        }])
        .then(answers => {
          if (answers.subfolder) {
            answers.subfolder = path.join('stage', answers.subfolder);
          }
          return answers;
        })
      } else {
        return answers;
      }
    })
    .then(function(answers) {
      options.subfolder = answers.subfolder;
      return options;
    });
  }
}

module.exports = GhpagesInquirer;
