# patternfly-eng-publish
A set of scripts for publishing PatternFly sites.

## Usage

```
Usage: bin/ghpages.js [options] <folder>
This script will publish files to a remote branch of your repo.

Options:
  -r, --repo    Git repo this script will publish to eg.: origin, upstream,
                bleathem, git@github.com:bleathem/bleathem.github.io.git
  -t, --travis  Perform a deploy from travis, using a travis encrypted key
                                                    [boolean] [default: "false"]
  -b, --branch  Remote branch this script will publish to  [default: "gh-pages"]
  -w, --web     Remove non-web files from the SITE_FOLDER/components folder
                prior to publishing                 [boolean] [default: "false"]
  -f, --foler   The folder to publish
  -h, --help    Show help                                              [boolean]

Examples:
  bin/ghpages.js -b gh-pages -r bleathem    Publish the public folder to the
  -f public                                 gh-pages branch of the bleathem
                                            repository

Copyright 2017, shared under the ASLv2 license
```

## Installation
npm install --save-dev patternfly-eng-publish

Add a run script to your package.json with appropriate options set:

```
"scripts": {
    "publish": "ghpages public"
  },
```

Use `npm run publish` to publish the site.

### Invoking from travis
Add another npm run script:

```
"scripts": {
    "publish-travis": "ghpages -t public"
  },
```

Update the .travis.yml file to invoke the script:

```
env:
  global:
    - ENCRYPTION_LABEL: "XXXXXXXXXXXX"
    - COMMIT_AUTHOR_EMAIL: "patternfly-build@redhat.com"
    - TRIGGER_REPO_SLUG: "patternfly/patternfly-atomic"
    - TRIGGER_REPO_BRANCH: "master"

...

after_success:
  - npm run publish-travis
```

## Adding deploy keys

We create a new key for every repo. Upload the public key to the repos via the github UI under _Settings_ -> _Deploy Keys_.

```ssh-keygen -t rsa -b 4096 -C "patternfly-build@redhat.com" -f deploy-key_patternfly-design```

The private key gets encrypted and placed in the repo itself.  `gem isntall travis` to use the travis tool to encrypt it.  Don't follow the instructions in the output of that command, but you do extract the encryption label from that message.

```travis encrypt-file deploy_key```

The publish-ghpages cript is written such that it will look for the file called "deploy_key.enc" and use the ENCRYPTION_LABEL env var to decrypt it.  It then uses ssh-agent to load the key and use it for git pushes (over ssh).

There is no need to share the keys.  We can re-create them more easily than we can manage sharing them.

# Development

This tool has a single CLI entrypoint: the `gh-pages` script.  The top-level class is the `Deployment` class.
Refer to script/class comments for further development details.
