'use strict';

const fs = require('fs-promise'),
      colors = require('colors'),
      exec = require('mz/child_process').exec,
      inquirer = require('inquirer');

class TravisEnvironment {
  init() {
    return this.checkTriggerRepo()
    .then(() => this.setUserInfo())
    .then(() => this.getDeployKey())
  }

  checkTriggerRepo() {
    if (process.env.TRAVIS !== 'true') {
      return Promise.reject(`Not running in a valid travis environment`);
    }
    if ( process.env.TRAVIS_REPO_SLUG === process.env.TRIGGER_REPO_SLUG ) {
      console.log(`This action is running against ${process.env.TRIGGER_REPO_SLUG}.`);
      if ( !process.env.TRAVIS_TAG && process.env.TRAVIS_BRANCH != process.env.TRIGGER_REPO_BRANCH ) {
        return Promise.reject(`This commit was made against ${process.env.TRAVIS_BRANCH} and not the ${process.env.TRIGGER_REPO_BRANCH} branch. Aborting.`);
      }
    } else {
      return Promise.reject(`This action is not running against ${process.env.TRIGGER_REPO_SLUG}. Aborting.`);
    }
    return Promise.resolve();
  }

  setUserInfo() {
    let promises = [];
    promises.push(exec('git config --global user.name "patternfly-build"'));
    promises.push(exec('git config --global user.email "patternfly-build@redhat.com"'));
    promises.push(exec('git config --global push.default simple'));
    return Promise.all(promises);
  }

  getDeployKey() {
    if (process.env.TRAVIS_PULL_REQUEST === 'true') {
      return Promise.reject('The travis ecrypted key var is not available to builds triggered by pull requests.  Aborting.');
    }
    // Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
    console.log(`ENCRYPTION_LABEL: ${process.env.ENCRYPTION_LABEL}`)
    let encryptedKeyVar=`encrypted_${process.env.ENCRYPTION_LABEL}_key`;
    let encryptedIvVar=`encrypted_${process.env.ENCRYPTION_LABEL}_iv`;
    console.log(`Checking Travis ENV VAR: ${encryptedKeyVar}...`);
    let encryptedKey=process.env[encryptedKeyVar];
    console.log(`Checking Travis ENV VAR: ${encryptedIvVar}...`);
    let encryptedIv=process.env[encryptedIvVar];
    if (! encryptedKey || ! encryptedIv ) {
      return Promise.reject('Unable to retrieve the encryption key');
    }
    return exec('mktemp -u $HOME/.ssh/XXXXX')
    .then(output => {
      let filename = output[0].split('\n')[0];
      let sshConfig = `
Host github.com
  IdentityFile ${filename}
  LogLevel ERROR`
      let commands = [
        `openssl aes-256-cbc -K ${encryptedKey} -iv ${encryptedIv} -in deploy_key.enc -out ${filename} -d`,
        'chmod 600 ${filename}',
        `echo "${sshConfig}" >> ~/.ssh/config`
      ];
      return exec(commands.join(' && '));
    })
  }
}

module.exports = TravisEnvironment;