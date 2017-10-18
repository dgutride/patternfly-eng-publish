'use strict';

const SiteWorktree = require('../lib/ghpages/site-worktree'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('SiteWorktree', () => {
  describe('#init', () => {
    it('should be fulfilled', () => {
      let siteWorktree = new SiteWorktree();
      siteWorktree.init().should.be.fulfilled;
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
      let siteWorktree = new SiteWorktree();
      return siteWorktree.init()
      .then(() => fs.mkdir('test/data/github.io'))
      .then(() => process.chdir('test/data/'))
      .then(() => siteWorktree.clean())
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
      let siteWorktree = new SiteWorktree();
      return siteWorktree.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => fs.mkdir('github.io/components'))
      .then(() => exec('touch github.io/components/test.exe'))
      .then(() => siteWorktree.clean())
      .then(() => fs.exists('github.io/components/test.exe'))
      .should.eventually.be.false;
    });
  });

  describe('#isClean', () => {
    let _cwd, siteWorktree;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
      siteWorktree = new SiteWorktree()
      return siteWorktree.clean();
    });
    afterEach(() => {
      return siteWorktree.clean()
      .then(() => {
        process.chdir(_cwd);
      });
    });

    it('should be clean in an clean chceckout', () => {
      return siteWorktree.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => exec(`git -C github.io init`))
      .then(() => exec(`touch github.io/README.md`))
      .then(() => exec(`git -C github.io add -A`))
      .then(() => exec(`git -C github.io commit -m'Initial commit'`))
      .then(() => siteWorktree.isClean())
      .should.eventually.be.true;
    });

    it('should not be clean in an dirty chceckout', () => {
      return siteWorktree.init()
      .then(() => fs.mkdir('github.io'))
      .then(() => exec(`git -C github.io init`))
      .then(() => exec(`touch github.io/README.md`))
      .then(() => exec(`git -C github.io add -A`))
      .then(() => exec(`git -C github.io commit -m'Initial commit'`))
      .then(() => exec(`touch github.io/some_file.ext`))
      .then(() => siteWorktree.isClean())
      .should.eventually.be.false;
    });
  });
});