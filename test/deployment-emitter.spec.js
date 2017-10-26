'use strict';

const deploymentEmitter = require('../lib/deploy/deployment-emitter'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise');
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('DeploymentEmitter', () => {
  describe('#on', () => {
    it('should trigger a listener', done => {
      deploymentEmitter.once('test', done);
      deploymentEmitter.emit('test');
      // return promise.should.eventually.be.fulfilled;
    });
  });
  describe('#resolve', () => {
    it('should trigger a listener', done => {
      deploymentEmitter.once('test', done);
      deploymentEmitter.resolve('test');
    });
  });
  describe('#promise', () => {
    it('should trigger a listener', () => {
      let promise = deploymentEmitter.promise('test');
      deploymentEmitter.resolve('test');
      return promise.should.eventually.be.fulfilled;
    });
  });
});
