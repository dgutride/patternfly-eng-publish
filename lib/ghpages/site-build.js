'use strict';

const fs = require('fs-promise'),
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
  }

  verifySiteBuildExists() {
    return fs.exists(this.path)
    .then(exists => exists || Promise.reject(new Error(`Site folder ${this.path} does not exist`)));
  }

  copyTo(copyPath) {
    let cmd = `rsync -rav --delete --exclude .git ${this.path}/ ${copyPath}`;
    console.log(`Copying site files from ${this.path} to ${copyPath}`);
    return exec(cmd);
  }
}

module.exports = SiteBuild;
