'use strict';

const fs = require('fs-promise'),
      mkdirp = require('mkdirp-promise'),
      colors = require('colors'),
      spawnPromise = require('spawn-rx').spawnPromise,
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
    return spawnPromise('git', 'rev-parse HEAD'.split(' '))
    .then(output => {
      this.sha = output.split('\n')[0];
      return this.sha;
    });
  }

  copyTo(copyPath) {
    console.log(`Copying site files from ${this.path} to ${copyPath}`);
    let cmd = `rsync -raq --delete --exclude .git ${this.path}/ ${copyPath}`;
    console.log(cmd);
    let args = cmd.split(' ');
    cmd = args.shift();
    return mkdirp(copyPath)
      .then(() => spawnPromise(cmd, args));
  }
}

module.exports = SiteBuild;
