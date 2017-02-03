#!/usr/bin/env node
'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

class Deployment {
  constructor(options) {
    this.deploymentFolder = new DeploymentFolder(options.filterBowerFiles);
    this.siteFolder = new SiteFolder(options.siteFolder);
    this.siteRepo = new SiteRepo(options.repoName, options.pushBranch);
    this.localClone = new LocalClone();
  }

  init() {
    return Promise.all([
      this.deploymentFolder.init(),
      this.siteFolder.init(),
      this.siteRepo.init(),
      this.localClone.init()
    ]);
  }

  deploy() {
    return this.deploymentFolder.clean()
    .then(() => this.siteRepo.clone(this.deploymentFolder.path))
    .then(() => this.siteFolder.copyTo(this.deploymentFolder.path))
    .then(() => this.deploymentFolder.filterFiles())
    .then(() => this.siteRepo.push(this))
    .then(() => this.deploymentFolder.clean())
  }
}

class DeploymentFolder {
  constructor(filterBowerFiles) {
    this.filterBowerFiles = filterBowerFiles;
    this.path = 'github.io';
  }

  init() {
    return Promise.resolve();
  }

  clean() {
    return fs.remove('github.io');
  }

  filterFiles() {
    if (this.filterBowerFiles) {
      let cmd = `find github.io/components -type f -not -iregex ".*/.*\.\(html\|txt\|js\|coffee\|css\|scss\|less\|otf\|eot\|svg\|ttf\|woff\|woff2\|png\|jpg\|gif\|ico\|xml\|yml\|yaml\|map\|json\|md\)" -print0 | xargs -0 rm`;
      console.log(colors.yellow('Removing non-web bower files.'));
      return exec(cmd);
    }
  }

  isClean() {
    return exec('git -C github.io add . -A')
    .then(() => exec('git -C github.io status --porcelain'))
    .then(output => {
      let clean = output[0].length === 0;
      return clean;
    });
  }

}

class SiteFolder {
  constructor(siteFolder) {
    this.path = siteFolder;
  }

  init() {
    return this.verifySiteFolderExists()
  }

  verifySiteFolderExists() {
    return fs.exists(this.path)
    .then(exists => exists || Promise.reject(new Error(`Site folder ${this.path} does not exist`)));
  }

  copyTo(copyPath) {
    let cmd = `rsync -rav --delete --exclude .git ${this.path}/ ${copyPath}`;
    console.log(cmd);
    return exec(cmd);
  }
}

class SiteRepo {
  constructor(repoName, pushBranch) {
    this.repoName = repoName;
    this.pushBranch = pushBranch;
  }

  init() {
    return this.inferRepo()
    .then(() => this.checkRemoteBranchExists());
  }

  inferRepo () {
    let promise;
    if ( this.repoName.endsWith('.git') ) {
      this.pushRepo = this.repoName;
      promise = Promise.resolve(this);
    } else {
      promise = exec(`git config remote.${this.repoName}.url`)
      .then(output => {
        let repo = output[0].split('\n')[0];
        this.pushRepo = repo.replace('https://github.com', 'git@github.com');
        return this;
      })
    }
    return promise
    .then(() => {
      console.log(`Inferred REPO ${this.pushRepo}`);
      return this;
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
    if (this.remoteBranchExists) {
      console.log(colors.green(`${this.pushBranch} branch exists, pushing updates`));
      console.log(`git clone --branch ${this.pushBranch} ${this.pushRepo} ${clonePath}`)
      return exec(`git clone --branch ${this.pushBranch} ${this.pushRepo} ${clonePath}`)
    } else {
      console.log(colors.green(`${this.pushBranch} branch does not exist, creating branch`));
      return exec(`git clone ${this.pushRepo} ${clonePath}`)
      .then(() => exec(`git -C ${clonePath} checkout --orphan ${this.pushBranch}`))
      .then(() => exec(`git -C ${clonePath} rm -rf .`));
    }
  }

  push(deployment) {
    let quiet = process.env.PF_GHPAGES_QUIET;
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
      if (quiet === 'true') {
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

class LocalClone {
  constructor() {
  }

  init() {
    return this.verifySourceBranch()
    .then(() => this.recordCommit());
    // .then(() => this.checkout());
  }

  verifySourceBranch() {
    return exec('git rev-parse --abbrev-ref HEAD')
    .then(output => {
      this.sourceBranch = output[0].split('\n')[0];
      if (this.sourceBranch === 'gh-pages-deploy') {
        return Promise.reject(new Error(`Error: cannot deploy from the branch ${this.sourceBranch}.  Please checkout a different branch.`));
      } else {
        return this;
      }
    });
  }

  recordCommit() {
    return exec('git rev-parse HEAD')
    .then(output => {
      this.sha = output[0].split('\n')[0];
      return this.sha;
    });
  }

  // do we need this?
  checkout() {
    console.log(this.sourceBranch)
    return exec(`git checkout ${this.sourceBranch} .`)
    .then(() => this)
    .catch(() => this)
  }
}

class TravisEnvironment {
  init() {
    return this.checkTriggerRepo()
    .then(this.setUserInfo())
    .then(this.getDeployKey())
  }

  checkTriggerRepo() {
    if (! process.env.TRAVIS_TAG) {
      return Promise.reject(`Not running in a valid travis environment`);
    }
    if ( process.env.TRAVIS_REPO_SLUG === process.env.TRIGGER_REPO_SLUG ) {
      console.log(`This action is running against ${process.env.TRIGGER_REPO_SLUG}.`);
      if ( process.env.TRAVIS_TAG && process.env.TRAVIS_BRANCH != process.env.TRIGGER_REPO_BRANCH ) {
        return Promise.reject(`This commit was made against ${process.env.TRAVIS_BRANCH} and not the ${process.env.TRIGGER_REPO_BRANCH} branch. Aborting.`);
      }
    } else {
      return Promise.reject(`This action is not running against ${process.env.TRIGGER_REPO_SLUG}. Aborting.`);
    }
    return Promise.resolve();
  }

  setUserInfo() {
    let promises = [];
    promises.push(exec('git config --global user.name "patternfly-build"'));
    promises.push(exec('git config --global user.email "patternfly-build@redhat.com"'));
    promises.push(exec('git config --global push.default simple'));
    return Promise.all(promises);
  }

  getDeployKey() {
    if (process.env.TRAVIS_PULL_REQUEST) {
      return Promise.reject('The travis ecrypted key var is not available to builds triggered by pull requests.  Aborting.');
    }
    // Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
    ENCRYPTED_KEY_VAR=`encrypted_${process.env.ENCRYPTION_LABEL}_key`;
    ENCRYPTED_IV_VAR=`encrypted_${process.env.ENCRYPTION_LABEL}_iv`;
    console.log(`Checking Travis ENV VAR: ${ENCRYPTED_KEY_VAR}...`);
    ENCRYPTED_KEY=process.env[ENCRYPTED_KEY_VAR];
    console.log(`Checking Travis ENV VAR: ${ENCRYPTED_IV_VAR}...`);
    ENCRYPTED_IV=process.env[ENCRYPTED_IV_VAR];
    return exec(`openssl aes-256-cbc -K ${ENCRYPTED_KEY} -iv ${ENCRYPTED_IV} -in deploy_key.enc -out deploy_key -d`)
    .then(exec('chmod 600 deploy_key'))
    .then(exec('eval `ssh-agent -s`'))
    .then(exec('ssh-add deploy_key'));
  }
}

module.exports = {
  Deployment: Deployment,
  DeploymentFolder: DeploymentFolder,
  LocalClone: LocalClone,
  SiteFolder: SiteFolder,
  SiteRepo: SiteRepo,
  TravisEnvironment: TravisEnvironment
}