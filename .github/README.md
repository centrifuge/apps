## Pipeline code decisions

#### One workflow per Trigger
Each workflow represents a different trigger rather than a different "way of building and deploying"
.github/workflows
├── centrifuge-app.yml -> triggers on PR or push to main (only changes to centrifuge-app components)
├── demo-deploys.yml -> manual triggered deployment (deploys all)
├── fabric.yml -> builds on PR or push to main (only changes to fabric/)
├── faucet-api.yml. Deploys 
├── npm-publish.yml -> always manual from main
├── onboarding-api.yml -> triggers on PR or push to main (only changes to onboarding-api/)
├── pinning-api.yml -> triggers on PR or push to main (only changes to pinning-api/)
├── pre-prod-deploys.yml -> Manually deploy from main to Altair & Pre-prod. Always manual. Requires approval
├── prepare-pr.yml -> Deploy functions for all PRs. Delete PR artifacts when closed
└── prod-deploys.yml -> Move artifacts from pre-prod. Always manual. Requires approval

#### Supporting actions
.github/actions
├── archive-release -> Upload artifacts to a pre-release
├── build-function -> Build function(s) using yarn
├── deploy-gcs -> deploy packaged code to google buckets
├── deploy-gfunction -> deploy Gfunction packaged code
├── fetch-function-secrets -> Convert $component/env-vars/$env.secrets to the right format for Gcloud
├── fetch-function-vars -> Convert $component/$env_name.env to the right format for Gcloud
└── prepare-deploy -> A bunch of logic to set variables for the different deployments on each env

#### Two deployment mechanisms
One for gcloud storage (static content) and one for Gfunctions (dynamic APIs)

#### Secrets and vars for functions

##### Secrets
Secrets are stored in Gcloud secrets and the functions will fetch them during runtime.
The secrets are passed as a single GH env variable that contains references to all the Gcloud secrets (only the secret name is exposed in this variable) and passed to the Function deploy so it can reference the right secrets for the specific app.

Secrets can be set for each function under `env-vars/$env.secrets`

##### ENV vars
Environment vars are passed as a one-liner, comma-separated string of values, if the number of vars gets large we might want to use env files or store them similarly to the the secrets reference in GH Actions directly 
Env vars need to be set per environment under the `env-vars` folder