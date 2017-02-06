'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

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
    let cmd = `git checkout ${this.sourceBranch} .`;
    console.log(cmd);
    return exec(cmd)
    .then(() => this)
    .catch(() => this)
  }
}

module.exports = LocalClone;