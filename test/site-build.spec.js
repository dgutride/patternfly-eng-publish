'use strict';

const SiteBuild = require('../lib/deploy/site-build'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      spawnPromise = require('spawn-rx').spawnPromise,
      exec = function(string) {
        // a wrapper around exec to always display stdout
        let args = string.split(' ');
        let cmd = args.shift();
        return spawnPromise(cmd, args);
      };
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('SiteBuild', () => {
  beforeEach(() => {
    return exec('mkdir test/data').catch(err => null);
  });
  describe('#verifySiteBuildExists', () => {
    it('should be fulfilled when the site folder exists', () => {
      let siteBuild = new SiteBuild('test/data');
      return siteBuild.verifySiteBuildExists().should.be.fulfilled;
    });
    it('should be rejected when the site folder does not exist', () => {
      let siteBuild = new SiteBuild('test/data2');
      return siteBuild.verifySiteBuildExists().should.be.rejected;
    });
  });

  describe('#copyTo', () => {
    beforeEach(() => {
      return exec('rm -rf test/data/')
      .then(() => fs.mkdir('test/data'));
    });

    it('should copy all files', () => {
      let siteBuild = new SiteBuild('test/data/folder1');
      return fs.mkdir('test/data/folder1')
      .then(() => siteBuild.init())
      .then(() => fs.writeFile('test/data/folder1/file.txt', 'test'))
      .then(() => siteBuild.copyTo('test/data/folder2'))
      .then(() => fs.exists('test/data/folder2/file.txt'))
      .should.eventually.be.true;
    });
  });
});
