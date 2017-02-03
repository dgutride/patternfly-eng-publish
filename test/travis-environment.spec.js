'use strict';

const TravisEnvironment = require('../lib/ghpages/TravisEnvironment'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
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
      process.env.TRAVIS_TAG='test';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.fulfilled;
    });
    it('should be rejected when TRAVIS_TAG is not set', function() {
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug ';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
    it('should be rejected with mismatching slugs', function() {
      process.env.TRAVIS_TAG='test';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug2';
      process.env.TRIGGER_REPO_BRANCH='master';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
    it('should be rejected with mismatching repos', function() {
      process.env.TRAVIS_TAG='test';
      process.env.TRAVIS_REPO_SLUG='slug';
      process.env.TRAVIS_BRANCH='master';
      process.env.TRIGGER_REPO_SLUG='slug';
      process.env.TRIGGER_REPO_BRANCH='master2';
      return travisEnvironment.checkTriggerRepo().should.be.rejected;
    });
  });
});

