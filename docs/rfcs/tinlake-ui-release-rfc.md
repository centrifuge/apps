# Tinlake Release Process

## Summary

The proposal is to shift to a simpler version of the [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) workflow, using one eternal branch, in order to handle hot fixes, immediately needed code changes, and to properly stamp releases. This is a multi-pronged proposal that includes implementing the `Gitflow` workflow, moving builds from Netlify to Github Actions, and updating deployment environments.

## Motivation

The current release process has a few limitations that can be addressed:

- There is no clear process for handling hot fixes which can become an issue as the user base grows and product demands increase.
- As the team grows, development speed could be strained and the communication around releases could become a burden as there would have to be a freeze on the `main` branch until the changes were smoke tested, confirmed, and merged into the `production` branch.
- Following release conventions by using `git tag`'ing establishes a clear release history for documentation and historical purposes.
- The [Netlify Github app](https://github.com/apps/netlify) currently being used is causing issues around automating preview links within pull requests that can be fixed by switching to using the [Netlify Github Action](https://github.com/marketplace/actions/netlify-actions). This will offer more control and flexibility over the build and deployment process.
- The current `staging` environment deploys using only the Kovan testnet. Perhaps, it would be more semantically correct to have a `staging.tinlake.centrifuge.io` (mainnet) and a `kovan.staging.tinlake.centrifuge.io` (Kovan) in order to have more genuine staging environments.
- This flow is agnostic from any platform like Netlify so by managing CI/CD workflows more explicitly, cutting over to IPFS or any other hosting provider in the future would be more seamless.

## Explanation

### Current Process

This process juggles two different permanent branches and must be constantly synced.

<img src="https://i.imgur.com/dx7KQzV.png" alt="current-process-diagram" width="550">

### Proposed Process

This process introduces ephemeral release branches and `git tag`'ing in order to manage releases.

<img src="https://i.imgur.com/WY3BH8C.png" alt="proposed-process-diagram" width="575">

Below is a visual of the how the `git` flow would look in action. `main` is never required to be frozen and there is no other permanent branch to sync with. This also allows for "horizontal" development for hot fixes or other immediately needed code changes.

<img src="https://i.imgur.com/ZKWmP2M.png" alt="proposed-process-diagram">

## Steps to Implement (One Time Actions)

1. Switch away from the [Netlify Github app](https://github.com/apps/netlify) and instead use the [Netlify Github Action](https://github.com/marketplace/actions/netlify-actions)
2. [Stop builds](https://docs.netlify.com/configure-builds/stop-or-activate-builds/#stop-builds) in Netlify for all `tinlake-ui` sites
3. [Turn on auto publish](https://docs.netlify.com/site-deploys/manage-deploys/#unlock-a-locked-deploy) in Netlify for all `tinlake-ui` sites
4. Set up a `dev.tinlake.centrifuge.io` site in Netlify
5. Delete `production` branch and only use `main` branch going forward
6. Remove `version` property from the [package.json](https://github.com/centrifuge/apps/blob/4547082ce44d99303af748aa503fec1f58501ee8/tinlake-ui/package.json#L4) in `tinlake-ui` directory

## Updated Steps to Release

#### Standard Release

Below are the steps for a standard release:

1. Create a branch off of `main` using the pattern `rc/tinlake-ui/release-*`
   - Example:
   ```sh
   $ git checkout -b tinlake-ui/release-3
   ```
2. Smoke test the preview link
   - Example:
     <br />
     <img src="https://media.giphy.com/media/8hmCdMaXUewzcroADq/giphy.gif" alt="smoking" height="200">
3. Create a tag from the `rc/tinlake-ui/release-*` branch using the pattern `tinlake-ui/release-*` and push to Github
   - Example:
   ```sh
   $ git tag tinlake-ui/release-3
   $ git push origin <tag_name>
   ```

#### Quick Release

Below are the steps for a quick release for a hotfix or some other immediate need:

##### Release

1. Create a branch off of the latest release candidate branch using the pattern `rc/tinlake-ui/release-*-hotfix-*`
   - Example:
   ```sh
   $ git checkout rc/tinlake-ui/release-8
   $ git checkout -b rc/tinlake-ui/release-8-hotfix-1
   ```
2. Submit a pull request with the necessary code changes against the latest release candidate branch
3. Once merged, smoke test the preview link
4. Create a tag from the latest release candidate branch using the pattern `tinlake-ui/release-*-hotfix-*` and push to Github
   - Example:
   ```sh
   $ git tag tinlake-ui/release-8-hotfix-1
   $ git push origin <tag_name>
   ```

##### Mergeback

Once released, a mergeback process needs to take place in order to bring in the new changes into `main`.

1. Checkout `main`
   ```sh
   $ git checkout main
   ```
2. Create a new mergeback branch
   ```sh
   $ git checkout -b fix/mergeback-[semantic-name-for-fix]
   ```
3. Cherry pick the hotfix
   - Example:
   ```sh
   $ git cherry-pick [commit-hash-of-hotfix]
   ```
4. Submit a pull request against `main`

## Drawbacks

- With a monorepo approach, using tags for different directories `directory/tag-name` can become noisy as the project grows
- Requires adequate `git` knowledge
- Since some of the implementations proposed are to address scaling concerns, this may be a premature optimization
