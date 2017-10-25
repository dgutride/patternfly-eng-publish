'use strict';

const EventEmitter = require('events');

class DeploymentEmitter extends EventEmitter {
  promise (event) {
    return new Promise( resolve => {
      this.once(event, deployment => {
        resolve(deployment);
      } );
    });
  }

  on (event, cb) {
    if (Promise.resolve(cb) == cb) {
      super.on(event, deployment => {
        cb.resolve(deployment);
      });
    } else {
      super.on(event, cb);
    };
  }

  resolve (event, deployment) {
    return new Promise((resolve, reject) => {
      this.emit(event, deployment);
      resolve(deployment);
    });
  }
}

const deploymentEmitter = new DeploymentEmitter();

module.exports = deploymentEmitter;