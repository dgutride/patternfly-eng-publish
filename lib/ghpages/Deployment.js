'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer'),
      DeploymentFolder = require('./DeploymentFolder'),
      LocalClone = require('./LocalClone'),
      SiteFolder = require('./SiteFolder'),
      SiteRepo = require('./SiteRepo');

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
    .catch(err => {
      console.error(colors.red(err.stack || err));
    })
    .then(() => this.deploymentFolder.clean())
  }
}

module.exports = Deployment