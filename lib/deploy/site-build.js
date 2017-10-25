'use strict';

const fs = require('fs-promise'),
      mkdirp = require('mkdirp-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

/**
The folder in which the site artifacts are built, ready to be deployed
**/
class SiteBuild {
  constructor(siteBuild) {
    this.path = siteBuild;
  }

  init() {
    return this.verifySiteBuildExists()
    .then(() => this.recordCommit());
  }

  verifySiteBuildExists() {
    return fs.exists(this.path)
    .then(exists => exists || Promise.reject(new Error(`Site folder ${this.path} does not exist`)));
  }

  recordCommit() {
    return exec('git rev-parse HEAD')
    .then(output => {
      this.sha = output[0].split('\n')[0];
      return this.sha;
    });
  }

  copyTo(copyPath) {
    let cmd = `rsync -ra --delete --exclude .git ${this.path}/ ${copyPath}`;
    console.log(`Copying site files from ${this.path} to ${copyPath}`);
    console.log(colors.dim(cmd));
    return mkdirp(copyPath)
      .then(() => exec(cmd));
  }
}

module.exports = SiteBuild;
