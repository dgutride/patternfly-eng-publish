'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      inquirer = require('inquirer'),
      spawnPromise = require('spawn-rx').spawnPromise;

/**
The folder that will be pushed to the gh-pages repo
**/
class SiteWorktree {
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
    return spawnPromise('git', ['-C', 'github.io', 'add', '.', '-A'])
    .then(() => spawnPromise('git', ['-C', 'github.io', 'status', '--porcelain']))
    .then(output => {
      let clean = output.length === 0;
      return clean;
    });
  }

}

module.exports = SiteWorktree
