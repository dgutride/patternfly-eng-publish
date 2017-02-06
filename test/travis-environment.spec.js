'use strict';

const TravisEnvironment = require('../lib/ghpages/travis-environment'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      exec = require('mz/child_process').exec,
      _ = require('lodash');
chai.use(chaiAsPromised);
chai.should();

describe('TravisEnvironment', function() {
  describe('#checkTriggerRepo()', function() {
    let travisEnvironment, _env;

    beforeEach(function() {
      travisEnvironment = new TravisEnvironment();
      _env = _.cloneDeep(process.env);
    });

    afterEach(function() {
      process.env = _.cloneDeep(_env);
    });
    it('should be rejected with no env vars set ', function() {
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
    it('should be fulfilled with matching repos and slugs', function() {
      process.env.TRAVIS='true';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.fulfilled;
    });
    it('should be rejected when TRAVIS is not set', function() {
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug ';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
    it('should be rejected with mismatching slugs', function() {
      process.env.TRAVIS='true';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug2';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
    it('should be rejected with mismatching repos', function() {
      process.env.TRAVIS='true';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug';
      process.env.TRIGGER_REPO_BRANCH='master2';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
  });

  describe('#getDeployKey()', function() {
    let travisEnvironment, _env;

    beforeEach(function() {
      travisEnvironment = new TravisEnvironment();
      _env = _.cloneDeep(process.env);
    });

    afterEach(function() {
      process.env = _.cloneDeep(_env);
    });
    it('should be rejected with no env vars set ', function() {
      return travisEnvironment.getDeployKey().should.be.rejected;
    });

    it('should be rejected when the TRAVIS_PULL_REQUEST is true ', function() {
      process.env.TRAVIS_PULL_REQUEST='false';
      return travisEnvironment.getDeployKey().should.be.rejectedWith('Unable to retrieve the encryption key');
    });

    it('should be rejected when the TRAVIS_PULL_REQUEST is false ', function() {
      process.env.TRAVIS_PULL_REQUEST='true';
      return travisEnvironment.getDeployKey().should.be.rejectedWith('The travis ecrypted key var is not available to builds triggered by pull requests.  Aborting.');
    });
  });
});

