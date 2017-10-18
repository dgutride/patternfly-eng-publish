'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer'),
      SiteWorktree = require('./site-worktree'),
      LocalClone = require('./local-clone'),
      SiteFolder = require('./site-build'),
      SiteRepo = require('./site-repo'),
      deploymentEmitter = require('./deployment-emitter');

/**
A deployment consists of

- SiteWorktree: The folder that will be pushed to the gh-pages repo
- SiteFolder: The folder in which the site artifacts are built, ready to be deployed
- SiteRepo: The repo to which we are deploying the site.

**/
class Deployment {
  constructor(options) {
    console.log(`Deploying the ${options.siteBuild} folder to the ${options.pushBranch} branch of the ${options.repoName} repo.`)
    this.siteWorktree = new SiteWorktree();
    this.siteBuild = new SiteFolder(options.siteBuild);
    this.siteRepo = new SiteRepo(options.repoName, options.pushBranch, options.travis);
    this.localClone = new LocalClone();
  }

  init() {
    return deploymentEmitter.resolve('deployment-init-start', this)
    .then(() => {
      return Promise.all([
        this.siteWorktree.init(),
        this.siteBuild.init(),
        this.siteRepo.init(),
        this.localClone.init()
      ])
    })
    .then(() => deploymentEmitter.resolve('deployment-init-end', this));
  }

  deploy() {
    return this.siteWorktree.clean()
    .then(() => this.siteRepo.clone(this.siteWorktree.path))
    .then(() => this.siteBuild.copyTo(this.siteWorktree.path))
    .then(() => deploymentEmitter.resolve('deploy-copy-after', this))
    .then(() => deploymentEmitter.resolve('deploy-push-before', this))
    .then(() => this.siteRepo.push(this))
    .catch(err => {
      console.error(colors.red(err.stack || err));
    })
    .then(() => this.siteWorktree.clean())
  }
}

module.exports = Deployment
