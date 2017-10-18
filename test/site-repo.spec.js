'use strict';

const SiteRepo = require('../lib/ghpages/site-repo'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise'),
      exec = require('mz/child_process').exec;
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('SiteRepo', () => {
  describe('#inferRepo', () => {
    it('should be populate the pushRepo property ', () => {
      let siteRepo = new SiteRepo('origin', 'master');
      return siteRepo.inferRepo().should.eventually.have.property('pushRepo')
      .should.eventually.endWith('.git')
    });
    it('should use the repoName directly when it ends with .git ', () => {
      let siteRepo = new SiteRepo('test.git', 'master');
      return siteRepo.inferRepo().should.eventually.have.property('pushRepo')
      .should.eventually.equal('test.git')
    });
  });

  describe('#checkRemoteBranchExists', function() {
    this.timeout(5000);  // Remote calls can be slow
    it('should be true', () => {
      let siteRepo = new SiteRepo('origin', 'master');
      return siteRepo.inferRepo()
      .then(() => siteRepo.checkRemoteBranchExists())
      .should.eventually.equal(true);
    });
    it('should be false', () => {
      let siteRepo = new SiteRepo('origin', 'doesnotexist');
      return siteRepo.inferRepo()
      .then(() => siteRepo.checkRemoteBranchExists())
      .should.eventually.equal(false);
    });
  });

  describe('#checkIfShallow', () => {
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
    });
    afterEach(() => {
      process.chdir(_cwd);
      return exec('rm -rf test/data/*');
    });

    it('should return true when the repo is shallow', () => {
      let siteRepo = new SiteRepo('origin', 'master');
      return fs.mkdir('repo')
      .then(() => process.chdir('repo'))
      .then(() => fs.mkdir('.git'))
      .then(() => exec('touch .git/shallow'))
      .then(() => siteRepo.checkIfShallow())
      .then(() => siteRepo.isShallow)
      .should.eventually.be.true;
    });

    it('should return false when the repo is not shallow', () => {
      let siteRepo = new SiteRepo('origin', 'master');
      return fs.mkdir('repo')
      .then(() => process.chdir('repo'))
      .then(() => fs.mkdir('.git'))
      .then(() => siteRepo.checkIfShallow())
      .then(() => siteRepo.isShallow)
      .should.eventually.be.false;
    });
  })

  describe('#clone', function() {
    this.timeout(5000);  // Remote calls can be slow
    let _cwd;
    beforeEach(() => {
      _cwd = process.cwd();
      process.chdir('test/data');
    });
    afterEach(() => {
      process.chdir(_cwd);
      return exec('rm -rf test/data/*');
    });

    it('should clone a local repo', () => {
      let siteRepo = new SiteRepo('origin', 'master', true);
      let deployment = {
        deploymentFolder: {
          isClean: () => Promise.resolve(false),
        },
        localClone: {
          sha: '123456'
        },
        siteBuild: {
          path: './'
        }
      }
      return fs.mkdir('original')
      .then(() => process.chdir('original'))
      .then(() => exec(`git init`))
      .then(() => exec(`echo hello > README.md`))
      .then(() => exec(`git add -A .`))
      .then(() => exec(`git commit -m'Initial commit'`))
      .then(() => process.chdir('..'))

      .then(() => exec(`git clone --bare original upstream`))

      .then(() => exec(`git clone upstream clone`))
      .then(() => process.chdir('clone'))
      .then(() => fs.mkdir('github.io'))
      .then(() => siteRepo.init())

      .then(() => exec(`git clone ../upstream github.io`))
      .then(() => exec(`echo test > github.io/README.md`))
      .then(() => siteRepo.push(deployment))

      .then(() => exec(`git pull`))
      .then(() => fs.readFile('README.md', 'utf8'))
      .should.eventually.equal('test\n');
    });
  });

  describe('#push', () => {
    it('should push changes to the remote repo', () => {

    })
  });
});
