# apps
![e2e-tests](https://github.com/centrifuge/apps/workflows/e2e-tests/badge.svg)

Monorepo for the Tinlake applications.

## Setup
Make sure you have installed Yarn and NVM.

1. Use Node v12.18.3: `nvm use`
2. Install dependencies: `yarn install`
3. Add `.env` files with the right environment variables to each project.

It's also recommended to run Prettier automatically in your editor, e.g. using [this VS Code plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

## Notes

To add other repositories to this monorepo while preserving the Git history, we can use the following steps: https://medium.com/@filipenevola/how-to-migrate-to-mono-repository-without-losing-any-git-history-7a4d80aa7de2
