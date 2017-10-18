'use strict';

const SiteBuild = require('../lib/ghpages/site-build'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('SiteBuild', () => {
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
    afterEach(() => {
      return exec('rm -rf test/data/*');
    });
    it('should copy all files', () => {
      let siteBuild = new SiteBuild('test/data/folder1');
      return fs.mkdir('test/data/folder1')
      .then(() => siteBuild.init())
      .then(() => exec('echo "test" > test/data/folder1/file.txt'))
      .then(() => siteBuild.copyTo('test/data/folder2'))
      .then(() => fs.exists('test/data/folder2/file.txt'))
      .should.eventually.be.true;
    });
  });
});
