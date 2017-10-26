'use strict';

const fs = require('fs-promise'),
      path = require('path'),
      colors = require('colors'),
      yaml = require('js-yaml'),
      SiteWorktree = require('./site-worktree'),
      SiteBuild = require('./site-build'),
      SiteRepo = require('./site-repo'),
      deploymentEmitter = require('./deployment-emitter');

/**
A deployment consists of

- SiteWorktree: The folder that will be pushed to the gh-pages repo
- SiteBuild: The folder in which the site artifacts are built, ready to be deployed
- SiteRepo: The repo to which we are deploying the site.

**/
class Deployment {
  constructor(options) {
    console.log(`Deploying the ${options.siteBuild} folder to the ${options.subfolder || 'root'} folder of the ${options.pushBranch} branch of the ${options.repoName} repo.`)
    this.siteWorktree = new SiteWorktree();
    this.siteBuild = new SiteBuild(options.siteBuild);
    this.siteRepo = new SiteRepo(options.repoName, options.pushBranch, options.travis);
    this.deploymentFolder = path.join(this.siteWorktree.path, options.subfolder);
  }

  init() {
    return deploymentEmitter.resolve('deployment-init-start', this)
    .then(() => {
      return Promise.all([
        this.siteWorktree.init(),
        this.siteBuild.init(),
        this.siteRepo.init(),
        this.verifyJekyllOptions()
      ])
    })
    .then(() => deploymentEmitter.resolve('deployment-init-end', this));
  }

  deploy() {
    return this.siteWorktree.clean()
    .then(() => this.siteRepo.clone(this.siteWorktree.path))
    .then(() => this.siteBuild.copyTo(this.deploymentFolder))
    .then(() => deploymentEmitter.resolve('deploy-copy-after', this))
    .then(() => deploymentEmitter.resolve('deploy-push-before', this))
    .then(() => this.siteRepo.push(this))
    .catch(err => {
      console.error(colors.red(err.stack || err));
    })
    // .then(() => this.siteWorktree.clean())
  }

  verifyJekyllOptions() {
    const jekyllConfig = path.join(this.siteBuild.path, '..', '_build/_config.yml');
    return fs.exists(jekyllConfig)
      .then(exists => {
        if (exists) {
          return fs.readFile(jekyllConfig)
            .then(contents => {
              const config = yaml.safeLoad(contents);
              return config.baseurl;
            })
        } else {
          return '';
        }
      })
      .then(baseurl => {
        let expectedBaseurl = this.siteRepo.pushRepo.endsWith('.github.io.git') ? '' : `/${this.siteRepo.pushRepoName}`;
        const stagefolder = path.relative(this.siteWorktree.path, this.deploymentFolder);
        if (path.normalize(baseurl) !== path.normalize(expectedBaseurl)) {
          console.error('baseurl:', baseurl, 'expectedBaseurl:', expectedBaseurl)
          return Promise.reject(`Rerun the site build with the --baseurl option set to: "${expectedBaseurl}"`);
        }
      })
  }
}

module.exports = Deployment
