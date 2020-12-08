# onboard-api

## Setup
Make sure you have installed Yarn and NVM.

1. Use Node v14.15.1: `nvm use` 
2. Install dependencies: `yarn install`
3. Create a Postgres database
4. Add `.env` file to the `onboard-api` folder
5. Run database migrations: `yarn db:migrate`

It's also recommended to run Prettier automatically in your editor, e.g. using [this VS Code plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

## Development

Compile & watch for changes: `yarn start`

## Env

Generate a private key for the session cookies:
`openssl genrsa -aes256 -out private.pem 2048`

And a public key:
`openssl rsa -in private.pem -outform PEM -pubout -out public.pem`