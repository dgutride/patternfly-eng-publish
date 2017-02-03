'use strict';

const DeploymentFolder = require('../lib/ghpages/DeploymentFolder'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('DeploymentFolder', () => {
  describe('#init', () => {
    it('should be fulfilled', () => {
      let deploymentFolder = new DeploymentFolder();
      deploymentFolder.init().should.be.fulfilled;
    })
  });

  describe('#clean', () => {
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
    });
    afterEach(() => {
      process.chdir(_cwd)
    });

    it('should exist', () => {
      let deploymentFolder = new DeploymentFolder();
      return deploymentFolder.init()
      .then(() => fs.mkdir('test/data/github.io'))
      .then(() => process.chdir('test/data/'))
      .then(() => deploymentFolder.clean())
      .then(() => fs.exists('github.io'))
      .should.eventually.equal(false);
    });
  });

  describe('#filterFiles', () => {
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
    });
    afterEach(() => {
      process.chdir(_cwd);
    });

    it('should remove *.exe files', () => {
      process.chdir('test/data');
      let deploymentFolder = new DeploymentFolder();
      return deploymentFolder.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => fs.mkdir('github.io/components'))
      .then(() => exec('touch github.io/components/test.exe'))
      .then(() => deploymentFolder.clean())
      .then(() => fs.exists('github.io/components/test.exe'))
      .should.eventually.be.false;
    });
  });

  describe('#isClean', () => {
    let _cwd, deploymentFolder;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
      deploymentFolder = new DeploymentFolder()
      return deploymentFolder.clean();
    });
    afterEach(() => {
      return deploymentFolder.clean()
      .then(() => {
        process.chdir(_cwd);
      });
    });

    it('should be clean in an clean chceckout', () => {
      return deploymentFolder.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => exec(`git -C github.io init`))
      .then(() => exec(`touch github.io/README.md`))
      .then(() => exec(`git -C github.io add -A`))
      .then(() => exec(`git -C github.io commit -m'Initial commit'`))
      .then(() => deploymentFolder.isClean())
      .should.eventually.be.true;
    });

    it('should not be clean in an dirty chceckout', () => {
      return deploymentFolder.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => exec(`git -C github.io init`))
      .then(() => exec(`touch github.io/README.md`))
      .then(() => exec(`git -C github.io add -A`))
      .then(() => exec(`git -C github.io commit -m'Initial commit'`))
      .then(() => exec(`touch github.io/some_file.ext`))
      .then(() => deploymentFolder.isClean())
      .should.eventually.be.false;
    });
  });
});