'use strict';

const Deployment = require('../lib/ghpages/Deployment'),
      chai = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      _ = require('lodash'),
      fs = require('fs-promise');
chai.use(require('chai-string'));
chai.use(chaiAsPromised);
chai.should();

describe('Deployment', () => {
});