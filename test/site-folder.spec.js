'use strict';

const ghpagesClasses = require('../script/ghpages-classes'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('SiteFolder', () => {
  describe('#verifySiteFolderExists', () => {
    it('should be fulfilled when the site folder exists', () => {
      let siteFolder = new ghpagesClasses.SiteFolder('test/data');
      return siteFolder.verifySiteFolderExists().should.be.fulfilled;
    });
    it('should be rejected when the site folder does not exist', () => {
      let siteFolder = new ghpagesClasses.SiteFolder('test/data2');
      return siteFolder.verifySiteFolderExists().should.be.rejected;
    });
  });

  describe('#copyTo', () => {
    afterEach(() => {
      return exec('rm -rf test/data/*');
    });
    it('should copy all files', () => {
      let siteFolder = new ghpagesClasses.SiteFolder('test/data/folder1');
      return fs.mkdir('test/data/folder1')
      .then(() => siteFolder.init())
      .then(() => exec('echo "test" > test/data/folder1/file.txt'))
      .then(() => siteFolder.copyTo('test/data/folder2'))
      .then(() => fs.exists('test/data/folder2/file.txt'))
      .should.eventually.be.true;
    });
  });
});
