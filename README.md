# apps

Monorepo for the Centrifuge applications.

## Setup

Make sure you have installed Yarn and NVM.

1. Use Node v14.15.1: `nvm use`
2. Install dependencies: `yarn install`
3. Install `husky`: `yarn postinstall`
4. Add `.env` files with the right environment variables to each project.

It's also recommended to run Prettier automatically in your editor, e.g. using [this VS Code plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

## Notes

To add other repositories to this monorepo while preserving the Git history, we can use the following steps: https://medium.com/@filipenevola/how-to-migrate-to-mono-repository-without-losing-any-git-history-7a4d80aa7de2

To set a pool into maintenance mode, add the pool id to the environment variable `NEXT_PUBLIC_FEATURE_FLAG_MAINTENANCE_MODE`.

## Agile release process
To make sure repository admins can control the full workflow of our apps to production safely this repository provides the following flow:

- When you open a PR a new cent-app will be deployed with your PR number on the URL such as: app-prXXX.k-f.dev

- After code is merged to main you can see the changes in: app-dev.k-f.dev

- When a repository admin creates a `centrifuge-app/v*` tag it will will trigger a deployment to [altair.centrifuge.io](https://altair.centrifuge.io). The release needs to FIRST be marked as `prerelease`. 
    > Draft releases or tags other than the one above will not trigger any deployments.

- Once ready, you can edit your pre-release and untick the "pre-release" setting to fully publish a release, this will trigger a refresh of our code in app.centrifuge.io and app.ipfs.centrifuge.io (coming soon)

More info on our release process rationale can be found in [our HackMD](https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view) (Private link, only k-f contributors)