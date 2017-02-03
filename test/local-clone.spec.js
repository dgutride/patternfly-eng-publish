'use strict';

const LocalClone = require('../lib/ghpages/LocalClone'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('LocalClone', () => {
  describe('#init()', () => {
    it('should be fulfilled when correctly instatntiated', () => {
      let localClone = new LocalClone('test/data', 'origin');
      return localClone.init().should.be.fulfilled;
    });
  });

  describe('#verifySourceBranch', () => {
    it('should be fulfilled when the source branch is master', () => {
      let localClone = new LocalClone('test/data', 'origin');
      return localClone.verifySourceBranch().should.be.fulfilled;
    });
  });

  describe('#recordCommit', () => {
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
    });
    afterEach(() => {
      process.chdir(_cwd);
      return exec('rm -rf test/data/repo1');
    });

    it('should return a sha', () => {
      let localClone = new LocalClone();
      return fs.mkdir('repo1')
      .then(() => {
        process.chdir('repo1')
      })
      .then(() => exec(`git init`))
      .then(() => exec(`touch README.md`))
      .then(() => exec(`git add -A .`))
      .then(() => exec(`git commit -m'Initial commit'`))
      .then(() => localClone.recordCommit())
      .should.eventually.have.length.of(40);
    })

  });

  describe('#checkout', () => {
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
    });
    afterEach(() => {
      process.chdir(_cwd);
      return exec('rm -rf test/data/repo1');
    });

    it('should revert any uncommitted changes', () => {
      let localClone = new LocalClone();
      return localClone.init()
      .then(() => fs.mkdir('repo1'))
      .then(() => {
        process.chdir('repo1')
      })
      .then(() => exec(`git init`))
      .then(() => exec(`touch README.md`))
      .then(() => exec(`git add -A .`))
      .then(() => exec(`git commit -m'Initial commit'`))
      .then(() => fs.readFile('README.md', 'utf8'))
      .should.eventually.equal('')
      .then(() => exec(`echo hello > README.md`))
      .then(() => fs.readFile('README.md', 'utf8'))
      .should.eventually.equal('hello\n')
      .then(() => localClone.checkout())
      .then(() => fs.readFile('README.md', 'utf8'))
      .should.eventually.equal('');
    });
  });
})
