'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      inquirer = require('inquirer'),
      gitUrlParse = require("git-url-parse"),
      spawnPromise = require('spawn-rx').spawnPromise;


/**
The repo to which we are deploying the site.  This is usually either:
- the gh-pages branch of the current repo
- the master branch of the <user/org name>.github.io repo
**/
class SiteRepo {
  constructor(repoName, pushBranch, quiet) {
    this.repoName = repoName;
    this.pushRepo = null; // will be inferred later
    this.pushBranch = pushBranch;
    this.quiet = quiet || false;
  }

  init() {
    return this.inferRepo()
    .then(() => this.checkRemoteBranchExists())
    .then(() => this.checkIfShallow());
  }

  inferRepo () {
    let promise;
    if ( this.repoName.endsWith('.git') ) {
      this.pushRepo = this.repoName;
      this.isLocalClone = false;
      promise = Promise.resolve(this);
    } else {
      this.isLocalClone = true;
      promise = spawnPromise('git', ['config', `remote.${this.repoName}.url`])
      .then(output => {
        let repo = output.split('\n')[0];
        this.pushRepo = repo.replace('https://github.com/', 'git@github.com:');
        return this;
      })
    }
    return promise
    .then(() => {
      this.pushRepoName = gitUrlParse(this.pushRepo).name;
      console.log(`Inferred REPO url ${this.pushRepo}`);
      return this;
    });
  }

  checkIfShallow () {
    return fs.exists('.git/shallow')
    .then(exists => {
      this.isShallow = exists;
    });
  }

  checkRemoteBranchExists () {
    return spawnPromise('git', ['ls-remote', '--heads', this.pushRepo, this.pushBranch])
    .then(output => {
      let head = output.split('\n')[0];
      this.remoteBranchExists = head.length > 0;
      return this.remoteBranchExists;
    })
  }

  clone(clonePath) {
    // Rather than clone the site, we create a new repo, set the upstream branch, and checkout the single most recent commit
    console.log('Cloning site repo...');
    return spawnPromise('git', ['init', clonePath])
    .then(() => spawnPromise('git', ['-C', clonePath, 'config', 'user.name', 'patternfly-build']))
    .then(() => spawnPromise('git', ['-C', clonePath, 'config', 'user.email', 'patternfly-build@patternfly.org']))
    .then(() => spawnPromise('git', ['-C', clonePath, 'remote', 'add', 'origin', this.pushRepo]))
    .then(() => {
      if (! this.remoteBranchExists) {
        return spawnPromise('git', ['-C', clonePath, 'checkout', '--orphan', this.pushBranch])
          .then(() => spawnPromise('git', ['-C', clonePath, 'reset', '--hard']))
      } else {
        return spawnPromise('git', ['-C', clonePath, 'fetch', '--depth', '1', 'origin', this.pushBranch, this.pushBranch])
          .then(() => spawnPromise('git', ['-C', clonePath, 'checkout', this.pushBranch]))
      }
    })
  }

  push(deployment) {
    return deployment.siteWorktree.isClean()
    .then(clean => {
      if (clean) {
        return Promise.reject('Site directory clean, no changes to commit.')
      } else {
        return spawnPromise('git', ['-C', 'github.io', 'commit', '-q', '-a', '-m', `Added files from commit #${deployment.siteBuild.sha}"`]);
      }
    })
    .then(() => {
      console.log(`Pushing commit ${deployment.siteBuild.sha} to repo ${this.pushRepo}.`);
      if (this.quiet === true) {
        return Promise.resolve({
          push: true
        });
      } else {
        return inquirer.prompt([{
          type: 'confirm',
          name: 'push',
          message: colors.yellow(`Push ${deployment.siteBuild.path} to repo ${this.pushRepo}/${this.pushBranch}?`),
          default: true
        }])
      }
    })
    .then(answers => {
      if (answers.push) {
        return spawnPromise('git', ['-C', 'github.io', 'push', '-q', this.pushRepo, `${this.pushBranch}:${this.pushBranch}`]);
      } else {
        return Promise.reject('Push aborted.');
      }
    });
  }
}

module.exports = SiteRepo;
