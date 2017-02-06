'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer'),
      DeploymentFolder = require('./deployment-folder'),
      LocalClone = require('./local-clone'),
      SiteFolder = require('./site-folder'),
      SiteRepo = require('./site-repo');

class Deployment {
  constructor(options) {
    console.log(`Deploying the ${options.siteFolder} folder to the ${options.pushBranch} branch of the ${options.repoName} repo.`)
    this.deploymentFolder = new DeploymentFolder(options.filterBowerFiles);
    this.siteFolder = new SiteFolder(options.siteFolder);
    this.siteRepo = new SiteRepo(options.repoName, options.pushBranch, options.travis);
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
    .catch(err => {
      console.error(colors.red(err.stack || err));
    })
    .then(() => this.deploymentFolder.clean())
  }
}

module.exports = Deployment