'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

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

module.exports = DeploymentFolder