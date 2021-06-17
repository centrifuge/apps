# tinlake-ui

## Development

### Clone the repository

```sh
$ git clone git@github.com:centrifuge/apps.git
$ cd apps
```

### Setup node

Use [nvm](https://github.com/nvm-sh/nvm) to install a stable version of node, `v12.16.3` at the time of writing (the `sha3` dependency did not work with newer versions in some cases). Once `nvm` is installed:

```sh
$ nvm install 12.16.3
$ nvm use 12.16.3
```

### Install dependencies

```sh
$ yarn install
```

### Setup environment

Copy `env` variables from the example file.

To point to the Kovan testnet:

```sh
$ cd tinlake-ui
$ cp .env.kovan-example .env
```

To point to mainnet:

```sh
$ cd tinlake-ui
$ cp .env.mainnet-example .env
```

### Run application

To build `tinlake.js` and start the NextJS server locally:

```shell
$ cd tinlake-ui
$ yarn start
```

### Debugging

There are a few flags you can use in your url query string to debug Tinlake:

#### General

`?address=0x..` or `?debug_eth_address=0x..` allows you to view the state of the UI for any Ethereum address

#### Dashboard/Pool list

`?showAll=true` allows you to view additional metrics for pools
`?showArchived=true` allows you to view archived pools

#### Rewards

`?debug=true` allows you to get additional data on the rewards for the connected user

### Environments

| Name            | Description                                                                                              | Domain                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Pull Request    | <ul><li>Deploys from a pull request</li><li>Points to Kovan testnet</li><li>Unstable</li></ul>           | `pr-<pull-request-number>--dev-tinlake.netlify.app`                                           |
| Dev             | <ul><li>Deploys from the `main` branch</li><li>Points to Kovan testnet</li><li>Unstable</li></ul>        | <a href="https://dev.tinlake.centrifuge.io">dev.tinlake.centrifuge.io</a>                     |
| Kovan Staging   | <ul><li>Deploys from a release candidate branch</li><li>Points to Kovan testnet</li><li>Stable</li></ul> | <a href="https://kovan.staging.tinlake.centrifuge.io">kovan.staging.tinlake.centrifuge.io</a> |
| Mainnet Staging | <ul><li>Deploys from a release candidate branch</li><li>Points to mainnet</li><li>Stable</li></ul>       | <a href="https://staging.tinlake.centrifuge.io">staging.tinlake.centrifuge.io</a>             |
| Prod            | <ul><li>Deploys from a release tag</li><li>Points to mainnet</li><li>Production environment</li></ul>    | <a href="https://tinlake.centrifuge.io">tinlake.centrifuge.io</a>                             |

### Release

#### Standard Release

Here is a visual of the software development lifecycle for `tinlake-ui`:

<img src="https://i.imgur.com/WY3BH8C.png" alt="proposed-process-diagram" width="575">

Below is the flow for a typical release:

##### Deploy Pull Requests

Deploys to `pr-<pull-request-number>--dev-tinlake.netlify.app` are automatically triggered when a pull request is submitted that contains changes to the `tinlake-ui` subdirectory

##### Deploy To Development

Deploys to <a href="https://dev.tinlake.centrifuge.io">dev.tinlake.centrifuge.io</a> are automatically triggered when changes are push/merged to the `main` branch that contains changes to the `tinlake-ui` subdirectory

##### Deploy To Staging

Create and push a branch off of `main` using the pattern `rc/tinlake-ui/release-*`

```sh
$ git checkout main
$ git branch rc/tinlake-ui/release-3
$ git push origin rc/tinlake-ui/release-3
```

This will trigger a deploy of `tinlake-ui` to two domains:

1. <a href="https://kovan.staging.tinlake.centrifuge.io">kovan.staging.tinlake.centrifuge.io</a> - points to Kovan testnet
2. <a href="https://staging.tinlake.centrifuge.io">staging.tinlake.centrifuge.io</a> - points to mainnet

Once deployed, smoke test both staging deployments

##### Deploy to Production

Once the staging deployments are smoke tested, create a tag from the `rc/tinlake-ui/release-*` branch using the pattern `tinlake-ui/release-*` and push to Github

```sh
$ git checkout rc/tinlake-ui/release-3
$ git tag tinlake-ui/release-3
$ git push origin tinlake-ui/release-3
```

This will trigger a deploy of `tinlake-ui` to the production domain, <a href="https://tinlake.centrifuge.io">tinlake.centrifuge.io</a>

Once deployed, smoke test the production deployment

#### Hotfix Release

Below are the steps for a quick release for a hotfix or some other immediate need:

##### Deploy to Staging

Create a branch off of the latest release candidate branch using the pattern `rc/tinlake-ui/release-*-hotfix-*`

```sh
$ git checkout rc/tinlake-ui/release-3
$ git checkout -b rc/tinlake-ui/release-3-hotfix-1

<---make code changes--->

$ git push origin rc/tinlake-ui/release-3-hotfix-1
```

This will trigger a deploy of `tinlake-ui` to the two domains:

1. <a href="https://kovan.staging.tinlake.centrifuge.io">kovan.staging.tinlake.centrifuge.io</a> - points to Kovan testnet
2. <a href="https://staging.tinlake.centrifuge.io">staging.tinlake.centrifuge.io</a> - points to mainnet

While this is deploying, submit a pull request with the necessary code changes against the latest release candidate branch

Once deployed, smoke test both staging deployments

##### Deploy to Production

Create a tag from the hotfix branch using the pattern `tinlake-ui/release-*-hotfix-*` and push to Github

```sh
$ git checkout rc/tinlake-ui/release-3-hotfix-1
$ git tag tinlake-ui/release-3-hotfix-1
$ git push origin tinlake-ui/release-3-hotfix-1
```

This will trigger a deploy of `tinlake-ui` to the production domain, <a href="https://tinlake.centrifuge.io">tinlake.centrifuge.io</a>

Once deployed, smoke test the production deployment

##### Mergeback

Once released, a mergeback process needs to take place in order to bring in the new changes into `main`.

1. Create a new mergeback branch:
   ```sh
   $ git checkout main
   $ git checkout -b fix/mergeback-[semantic-name-for-fix]
   ```
2. Cherry pick the hotfix:
   ```sh
   $ git cherry-pick [commit-hash-of-hotfix]
   ```
3. Submit a pull request against `main`
