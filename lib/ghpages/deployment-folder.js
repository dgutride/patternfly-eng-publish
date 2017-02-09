'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

class DeploymentFolder {
  constructor() {
    this.path = 'github.io';
  }

  init() {
    return Promise.resolve();
  }

  clean() {
    return fs.remove('github.io');
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

module.exports = DeploymentFolder