# Gateway [![Build Status](https://travis-ci.com/centrifuge/gateway.svg?token=LpuoLEpkXWjp999VGisL&branch=develop)](https://travis-ci.com/centrifuge/gateway)

## Intro

`Centrifuge Gateway` is a user interface that showcases the [go-centrifuge node API](https://github.com/centrifuge/go-centrifuge/). It's main purpose is to act as a testing and rapid prototyping tool for simple integrations with Centrifuge OS.

`Centrifuge Gateway` allows you to:

- Create and manage different users
- Create, anchor and exchange customised financial documents
- Mint and transfer non-fungible tokens (NFTs) based on these documents
- Request and accept funding based on these documents

**Getting help**:
Head over to our developer documentation at [developer.centrifuge.io](http://developer.centrifuge.io) to learn more about Centrifuge OS and the Centrifuge Node. If you have any questions, feel free to join our [slack channel](https://join.slack.com/t/centrifuge-io/shared_invite/enQtNDYwMzQ5ODA3ODc0LTU4ZjU0NDNkOTNhMmUwNjI2NmQ2MjRiNzA4MGIwYWViNTkxYzljODU2OTk4NzM4MjhlOTNjMDAwNWZkNzY2YWY).

**DISCLAIMER**: The code released here presents a very early alpha version that should not be used in production and has not been audited. Use this at your own risk.

## Getting started

### Running locally

Create `packages/server/.env` as described in `packages/server/README.md`.

Gateway requires a Centrifuge Node to run. Either connect via VPN to a deployed node, or see [here](https://developer.centrifuge.io/cent-node/overview/introduction/), how to set-up and configure a Centrifuge Node and interact with it. If running your own node, make sure you configure the node's webhooks to call your future Gateway instance. By default this will be `localhost:3001/webhooks`.

#### Connect with deployed Amber node

```
NODE_ENV=development REACT_APP_DISABLE_2FA=true REACT_APP_ADMIN_USER=gateway@centrifuge.io REACT_APP_ADMIN_PASSWORD=admin ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://34.89.251.225:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x0A735602a357802f553113F5831FE2fbf2F0E2e0 yarn start
```

#### connect with Amber node 2.0
```
NODE_ENV=development REACT_APP_DISABLE_2FA=true REACT_APP_ADMIN_USER=gateway@centrifuge.io REACT_APP_ADMIN_PASSWORD=admin ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://34.89.173.240:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x0A735602a357802f553113F5831FE2fbf2F0E2e0 JWT_PRIV_KEY=$(cat jwtRS256.key) JWT_PUB_KEY=$(cat jwtRS256.key.pub) yarn start
```

#### Connect with local node

```
NODE_ENV=development REACT_APP_DISABLE_2FA=true REACT_APP_ADMIN_USER=gateway@centrifuge.io REACT_APP_ADMIN_PASSWORD=admin ETH_NETWORK=kovan ETH_PROVIDER=https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5 CENTRIFUGE_URL=http://127.0.0.1:8082 CENTRIFUGE_ADMIN_ACCOUNT=0x0A735602a357802f553113F5831FE2fbf2F0E2e0 yarn start
```

## Using `Centrifuge Gateway`

### Multi tenancy and managed identities

Gateway is designed to use a multi tenancy Centrifuge Node. This means that all accounts created with gateway will
have a on chain Identity where the node wallet is configured as a MANAGEMENT KEY. Gateway users do not
need a wallet to interact with ETH and all ETH transaction use the wallet configured on the node.

### Managing user accounts and permissions

A user can have the following permission

```javascript
export enum PERMISSIONS {
 // can create and manage user accounts
 CAN_MANAGE_USERS = 'can_manage_users',
 // can create and manage schemas
 CAN_MANAGE_SCHEMAS = 'can_manage_schemas',
 // can create and manage FlexDocs. When a user has this permission  document schemas
 // can be assigned to this account and he will be able to create documents
 CAN_MANAGE_DOCUMENTS = 'can_manage_documents',
 // Can view received FlexDocs. He does need to have schemas assigned
 CAN_VIEW_DOCUMENTS = 'can_view_documents'
}
```

### Registering a new user

By default a newly created account is in invite mode. This means that the invited user needs to register first with his given user name / email and define a password. Then he can use these credentials to log-in.
Note, that Gateway will not send emails or notifications to invited users. Also note, that there is no "forgotten password" option.

### Creating and managing schemas for flexible documents (FlexDocs)

Gateway allows you to define customizable financial document schemas that can be assigned to a user with a `CAN_MANAGE_DOCUMENTS` permission. This enables a user to create specific documents or do actions with those documents (e.g.: Minting an NFT).

You can read and understand how Gateway schemas work [here](https://centrifuge.hackmd.io/@rQf339bfSHi_a3rLcEuoaQ/S1Ofvf34B).

### Contact List

Every user has a simple contact list that stores Centrifuge Identities of other users. Gateway interaction with another Centrifuge Identity (e.g.: Sending a document to some else) require the Centrifuge Identity to be included in the contact list. These interactions will perform a lookup in the contact list.

## Limitations

Centrifuge Gateway, Centrifuge Protocol and all its components are in an early stage of their development. They have a limited feature set compared to the end-vision. Not all features are implemented yet, and tradeoffs between security, speed, end-user features, and protocol flexibility are made continuously. This might and will lead to substantial changes in the future, re-architecture, addition and removal of features, as well as unexpected behavior. Use at your own risk.

## Build locally

Required Node Version: 12.16.1

```bash
yarn install
yarn run build
yarn run test
```
