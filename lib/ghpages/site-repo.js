'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

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
      promise = exec(`git config remote.${this.repoName}.url`)
      .then(output => {
        let repo = output[0].split('\n')[0];
        this.pushRepo = repo.replace('https://github.com/', 'git@github.com:');
        return this;
      })
    }
    return promise
    .then(() => {
      console.log(`Inferred REPO ${this.pushRepo}`);
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
    return exec(`git ls-remote --heads ${this.pushRepo} ${this.pushBranch}`)
    .then(output => {
      let head = output[0].split('\n')[0];
      this.remoteBranchExists = head.length > 0;
      return this.remoteBranchExists;
    })
  }

  clone(clonePath) {
    let clonePromise = Promise.resolve()
    .then(() => {
      console.log('Cloning site repo...');
      return this.isLocalClone && ! this.isShallow
      ? exec(`git clone . ${clonePath}`)
        .then(() => exec(`git -C ${clonePath} remote set-url origin ${this.pushRepo}`))
        .then(() => exec(`git -C ${clonePath} fetch origin`))
      : exec(`git clone ${this.pushRepo} ${clonePath}`);
    });

    if (this.remoteBranchExists) {
      console.log(`${this.pushBranch} branch exists, pushing updates`);
      return clonePromise
      .then(() => exec(`git -C ${clonePath} checkout -t -B ${this.pushBranch} origin/${this.pushBranch}`))
    } else {
      console.log(colors.green(`${this.pushBranch} branch does not exist, creating branch`));
      return clonePromise
      .then(() => exec(`git -C ${clonePath} checkout --orphan ${this.pushBranch}`))
      .then(() => exec(`git -C ${clonePath} rm -rf .`));
    }
  }

  push(deployment) {
    return deployment.deploymentFolder.isClean()
    .then(clean => {
      if (clean) {
        return Promise.reject('Site directory clean, no changes to commit.')
      } else {
        return exec(`git -C github.io commit -q -a -m "Added files from commit #${deployment.localClone.sha}"`);
      }
    })
    .then(() => {
      console.log(`Pushing commit ${deployment.localClone.sha} to repo ${this.pushRepo}.`);
      if (this.quiet === true) {
        return Promise.resolve({
          push: true
        });
      } else {
        return inquirer.prompt([{
          type: 'confirm',
          name: 'push',
          message: colors.yellow(`Push ${deployment.siteFolder.path} to repo ${this.pushRepo}/${this.pushBranch}?`),
          default: true
        }])
      }
    })
    .then(answers => {
      if (answers.push) {
        return exec(`git -C github.io push ${this.pushRepo} ${this.pushBranch}:${this.pushBranch}`);
      } else {
        return Promise.reject('Push aborted.');
      }
    });
  }
}

module.exports = SiteRepo;
