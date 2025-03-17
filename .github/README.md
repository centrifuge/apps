# Centrifuge Applications Monorepo

This monorepo contains the core applications and libraries that power the Centrifuge platform.

## Architecture

The repository is organized into several key components:

#### Main Application
- **centrifuge-app**: The main web application interface for Centrifuge

#### Libraries (NPM Packages)
- **centrifuge-js**: JavaScript client library for interacting with Centrifuge/Altair chains, built on top of @polkadot/api
- **centrifuge-react**: React component library that combines centrifuge-js and fabric
- **fabric**: Design system and component library providing shared styles and UI elements

#### Supporting Services
- **pinning-api**: Service for handling IPFS operations required by centrifuge-app
- **onboarding-api**: Independent service managing user/entity onboarding and KYC/KYB processes via ShuftiPro
- **faucet-api**: Development-only service for managing test tokens

## Development Setup

### Prerequisites
- Node.js (version specified in .nvmrc)
- Yarn (workspace configuration in .yarnrc.yml)

### Installation
```bash
yarn install
```

### Environment Setup
Copy the example environment files for each component that requires configuration:
```bash
# Main application
cp centrifuge-app/.env.sample centrifuge-app/.env

# Onboarding API
cp onboarding-api/.env.example onboarding-api/.env

# Pinning API
cp pinning-api/env.yaml.example pinning-api/env.yaml
```

### Development Workflow

#### Centrifuge App
```bash
cd centrifuge-app
yarn dev     # Start development server
```
#### APIs

**Pinning API**
```bash
cd pinning-api
yarn dev     # Start development server
```

**Onboarding API**
```bash
cd onboarding-api
yarn dev     # Start development server
```

**Faucet API (Development Only)**
```bash
cd faucet-api
yarn dev     # Start development server
```

## Testing

The repository includes simulation tests that provide lightweight testing without requiring a full browser environment. These can be found in the `simulation-tests` directory.

## Preparing new or a recently resetted environment

### Faucet (only available in demo and dev)

1. Add a valid seed hex to `faucet-api/env-vars/demo.secrets`
2. Fund the account wallet with all availabe pool currencies and the native currency

### Onboarding API

> Setup is ONLY for dev

Setup pure proxy to sign transactions (whitelisting & transfer tokens).

1. Use sudo in polkadot UI to give Alice enough currency to distribute (tokens.setBalance()). For currencyId select ForeignAsset and submit the transacton once with ForeignAsset 1 and once with ForeignAsset 2
2. Run `/initProxies` to create the pure proxy, fund it, and give it sufficient permissions
3. Copy the resulting pure proxy address and add it to the env varibles: `MEMBERLIST_ADMIN_PURE_PROXY` (onboarding-api) and `REACT_APP_MEMBERLIST_ADMIN_PURE_PROXY` (centrifuge-app)
4. Enable onboarding for each new pool under /dashboard/investors

## Full Release process

From a developer's perspective, the following happens to a line of code before it gets to prod:

1. Local testing in Dev's laptop
2. **Open a PR** -> Creates two preview sites (ff-prod and dev). See the comments in your PR
3. **Merge PR** -> Preview sites automatically deleted and deploys to DEV and ff-prod (urls below)
4. **Staging/Pre-prod** 
    - Open [GH Releases](https://github.com/centrifuge/apps/releases) and cretate a new one. Alternatively run something like this: `gh release create --prerelease "centrifuge-app/v${VERSION}"xx`
   -  Wait for [the job](https://github.com/centrifuge/apps/actions/workflows/staging-deploy.yml) to finish
from `main` branch, which creates a permanent tag and thus a point in time for our code -> Deploy to Altair and staging. Upload deploy artifacts to the release
5. **Deploy to prod** 
   - *(Option 1)* 
     - Navigate to the [release summary](https://github.com/centrifuge/apps/releases) and select the pre-release you want to publish. 
     - Untick the `Set as a pre-release` checkbox and then tick the `Set as the latest release` checkbox. 
     - Click `Update release` to trigger the prod deployment. As with the pre-release, the production release must be approved by a reviewer.
     - Follow your prod deployment in the [Actions dashboard](https://github.com/centrifuge/apps/actions/workflows/prod-deploy.yml)
   - *(Option 2)* Run the GH job directly with an specified tag (it requires that tag to have an associated release): https://github.com/centrifuge/apps/actions/workflows/demo-deploys.yml

Note: production deployments require de approval of at least one team member other than the one that triggered the release.

### Environments & Deployments

| Name | Trigger | Chain / Back-end | Public URL |
| --- | --- | --- | --- |
| Production / Centrifuge | Promote release [Manual trigger](https://github.com/centrifuge/apps/actions/workflows/prod-deploy.yml) | Centrifuge (persistent) | [app.centrifuge.io](http://app.centrifuge.io/) |
| Staging | Create a GH pre-release | Centrifuge | [app.staging.centrifuge.io](http://app.staging.centrifuge.io/) |
| Altair | Create a GH pre-release | Altair (persistent) | [app.altair.centrifuge.io](http://app.altair.centrifuge.io/) |
| ~~Catalyst~~ | ~~push tag~~ | ~~Catalyst (persistent)~~ | ~~app-catalyst.k-f.dev~~ |
| Demo | [manual trigger](https://github.com/centrifuge/apps/actions/workflows/demo-deploys.yml) | Demo chain (persistent) | [app-demo.k-f.dev](http://app-demo.k-f.dev) |
| Fast-forward prod | push to `main` | Centrifuge | [app-ff-production.k-f.dev](https://app-ff-production.k-f.dev/) |
| Dev | push to `main` | Dev chain (ephemeral) | [app-dev.k-f.dev](http://app-dev.k-f.dev) |
| Previews | open a PR | Dev chain | app-prXYZ.k-f.dev and app-prXYZ-app-ff-production.k-f.dev |

### Staging & FF-prod

This will be an exact copy of what prod will look like, the front end will be pointing to the production infrastructure, the only difference is the URL.

Once staging is validated, a Github job can trigger a sync between staging and prod (rather than building from scratch from a commit/release/tag). This way we ensure we're promoting code line-by-line to prod.

### Functions deployments

Generally functions will only deploy using the above rules if the functions directories have any changes, **except for PRs** where functions will always be deployed at least once to test your PR in a preview, wether you change your functions folder or not.

### Notes

To add other repositories to this monorepo while preserving the Git history, we can use the following steps: https://medium.com/@filipenevola/how-to-migrate-to-mono-repository-without-losing-any-git-history-7a4d80aa7de2

To set a pool into maintenance mode, add the pool id to the environment variable `NEXT_PUBLIC_FEATURE_FLAG_MAINTENANCE_MODE`.