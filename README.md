# patternfly-eng-publish
A set of scripts for publishing PatternFly sites.

## Usage

```
This script will publish files to the gh-pages branch of your repo.

publish-ghpages.sh [option] folder

Example: publish-ghpages.sh

OPTIONS:
h       Display this message
t       Perform a deploy from travis, using a travis encrypted key
w       Remove non-web files from the SITE_FOLDER/components folder prior to publishing
b       Remote branch this script will publish to
        default: gh-pages
r       Git repo this script will publish to
        eg.: origin, upstream, bleathem, git@github.com:bleathem/bleathem.github.io.git
        default: origin
```

## Adding deploy keys

We create a new key for every repo. Upload the public key to the repos via the github UI under _Settings_ -> _Deploy Keys_.

```ssh-keygen -t rsa -b 4096 -C "patternfly-build@redhat.com" -f deploy-key_patternfly-design```

The private key gets encrypted and placed in the repo itself.  `gem isntall travis` to use the travis tool to encrypt it.  Don't follow the instructions in the output of that command, but you do extract the encryption label from that message.

```travis encrypt-file deploy_key```

The publish-ghpages cript is written such that it will look for the file called "deploy_key.enc" and use the ENCRYPTION_LABEL env var to decrypt it.  It then uses ssh-agent to load the key and use it for git pushes (over ssh).

There is no need to share the keys.  We can re-create them more easily than we can manage sharing them.
