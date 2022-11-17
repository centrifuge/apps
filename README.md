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
