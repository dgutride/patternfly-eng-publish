'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer'),
      DeploymentFolder = require('./deployment-folder'),
      LocalClone = require('./local-clone'),
      SiteFolder = require('./site-folder'),
      SiteRepo = require('./site-repo'),
      deploymentEmitter = require('./deployment-emitter');

class Deployment {
  constructor(options) {
    console.log(`Deploying the ${options.siteFolder} folder to the ${options.pushBranch} branch of the ${options.repoName} repo.`)
    this.deploymentFolder = new DeploymentFolder();
    this.siteFolder = new SiteFolder(options.siteFolder);
    this.siteRepo = new SiteRepo(options.repoName, options.pushBranch, options.travis);
    this.localClone = new LocalClone();
  }

  init() {
    return deploymentEmitter.resolve('deployment-init-start', this)
    .then(() => {
      return Promise.all([
        this.deploymentFolder.init(),
        this.siteFolder.init(),
        this.siteRepo.init(),
        this.localClone.init()
      ])
    })
    .then(() => deploymentEmitter.resolve('deployment-init-end', this));
  }

  deploy() {
    return this.deploymentFolder.clean()
    .then(() => this.siteRepo.clone(this.deploymentFolder.path))
    .then(() => this.siteFolder.copyTo(this.deploymentFolder.path))
    .then(() => deploymentEmitter.resolve('deploy-copy-after', this))
    .then(() => deploymentEmitter.resolve('deploy-push-before', this))
    .then(() => this.siteRepo.push(this))
    .catch(err => {
      console.error(colors.red(err.stack || err));
    })
    .then(() => this.deploymentFolder.clean())
  }
}

module.exports = Deployment