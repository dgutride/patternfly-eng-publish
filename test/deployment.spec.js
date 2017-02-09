'use strict';

const Deployment = require('../lib/ghpages/deployment'),
      deploymentEmitter = require('../lib/ghpages/deployment-emitter'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise');
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('Deployment', () => {
  describe('#init', () => {
    it('should fire deployment-init-* lifecycle events', () => {
      let initStart = deploymentEmitter.promise('deployment-init-start');
      let initEnd = deploymentEmitter.promise('deployment-init-end');
      let deployment = new Deployment({
        siteFolder: '.',
        repoName: 'origin'
      });
      return Promise.all([deployment.init(), initStart, initEnd]).should.eventually.be.fulfilled;
    });
  });
});