# Adding variables and secrets for Gfunctions

## Variables folder name
`env-vars` directory inside your function folder. *Ex: apps/function-api/env-vars*
> If you change the folder name you will have to change it for all functions and also add it to [the workflow file](https://github.com/centrifuge/apps/blob/main/.github/actions/deploy-gfunction/action.yml#L64-L81)


## Filenames and conventions
The file names need to follow the format below:
```
$env_name.env
$env_name.secrets
```
Where `$env_name` is one of: development, demo, catalyst, altair, or production.
More info can be found in the [release management document](https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view#Environments-amp-Deployments) (private to k-f members)

> Pull request will use the environment.env file and staging will use the production.env file. See the logic in `.github/actions/prepare_env`
Example:
```
function-api/env-vars
├── altair.env
├── altair.secrets
├── catalyst.env
├── catalyst.secrets
├── demo.env
├── demo.secrets
├── development.env
├── development.secrets
└── production.env
└── production.secrets
```
### Env file format

The format inside the files follows the [dotenv](https://www.npmjs.com/package/dotenv) configuration compatible with many JS libraries and frameworks.
But because the files need to be transformed to be used in Gfunctions there's some restrictions:
- Cannot be an empty file. If an environment does not apply to your function, do not create the env file for that environment.
- Do not add comments, it'll work with JS dotenv but it will try to load the comment into Gfunctions erroring out the deployment.
- Strings and one-line variables only, no JSON or other funny formats in a variable. Consult DevOps before adding something like that
- Be careful with empty spaces sinced the Gfunction expects all variables in one line concatenated and comma separated. Spaces could make it so the variable in Gfunction will contain unintended spaces at the beginning or the end of your var.

### Secrets file format

> In order to use secrets locally you'll have to use an .env file and let dotenv load them for you. Never commit these files to Github

For your Gfunction to have secrets assigned, you'll need to add such secrets to the [secret manager in the Gcloud console](https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets). After creating the secret you will need to [add a version to it](https://cloud.google.com/secret-manager/docs/add-secret-version), function will fail if a secret does not have any versions yet, and will always use the latest pushed version of the secret.

> Ideally, your secrets have a prefix like MYFUNCTION_$SECRET . This will make it easier to manage and filter in the Gcloud console.

For GHA to apply your secrets to the function you need to:
1. Add a `$env.secrets` where $env is one of our environments. See Filenames and conventions above.
2. Dev, demo, catalyst, and PRs need to be added to the Gcloud DEV account, all k-f front-end developers should already have the necessary permissions.
3. Altair and prod need to be added to our Google Cloud PROD account. Please reach an administrator to add your secrets to prod, once created, designated people in the apps team can add versions to it at any time before your function reaches Altair deployments.
4. The format of the secrets is `projects/$PROJECT_NAME/secrets/$SECRET_NAME`
> ⚠️ You can find the project ID/Name in the Gcloud console, or in your [secret's description](https://cloud.google.com/sdk/gcloud/reference/secrets/describe)
#### Secrets special considerations

You can add 1 secret to the Gcloud DEV account and share it amongst all lower environments (demo, PRs, dev, etc).
Example:

Do this for every secret:
```
gcloud secrets create MYFUNCTION_PINATA_API_KEY
# Create and edit /tmp/secret with the value of the secret. no spaces or new lines
gcloud secrets versions add MYFUNCTION_PINATA_API_KEY --data-file=/tmp/secret
```
If you need a secret to be different for each environment, append the environment name to the secret name:
MYFUNCTION_PINATA_API_KEY_DEV
MYFUNCTION_PINATA_API_KEY_DEMO
etc.

Otherwise, you can use the same secret in multiple environments. See this example from onboarding-api:
```
tail -n +1 onboarding-api/env-vars/*.secrets

==> onboarding-api/env-vars/catalyst.secrets <==
SHUFTI_PRO_SECRET_KEY=projects/cent-dev/secrets/SHUFTI_PRO_SECRET_KEY
SHUFTI_PRO_CLIENT_ID=projects/cent-dev/secrets/SHUFTI_PRO_CLIENT_ID
JWT_SECRET=projects/cent-dev/secrets/JWT_SECRET
SENDGRID_API_KEY=projects/cent-dev/secrets/SENDGRID_API_KEY

==> onboarding-api/env-vars/demo.secrets <==
SHUFTI_PRO_SECRET_KEY=projects/cent-dev/secrets/SHUFTI_PRO_SECRET_KEY
SHUFTI_PRO_CLIENT_ID=projects/cent-dev/secrets/SHUFTI_PRO_CLIENT_ID
JWT_SECRET=projects/cent-dev/secrets/JWT_SECRET
SENDGRID_API_KEY=projects/cent-dev/secrets/SENDGRID_API_KEY

==> onboarding-api/env-vars/development.secrets <==
SHUFTI_PRO_SECRET_KEY=projects/cent-dev/secrets/SHUFTI_PRO_SECRET_KEY
SHUFTI_PRO_CLIENT_ID=projects/cent-dev/secrets/SHUFTI_PRO_CLIENT_ID
JWT_SECRET=projects/cent-dev/secrets/JWT_SECRET
SENDGRID_API_KEY=projects/cent-dev/secrets/SENDGRID_API_KEY
```
The PROD secrets will be different from those, but Altair and prod can share the same secrets because they're both deployed in the PROD Gcloud account 
> Notice the projects/centrifuge-production part of the secrets is different for prod, this indicates which Gcloud account to fetch the secrets from. If you try to fetch a prod account secret from a dev deployed function it will fail and you can see the Access denied in your Function logs.

```
tail -n +1 onboarding-api/env-vars/*.secrets
==> onboarding-api/env-vars/altair.secrets <==
SHUFTI_PRO_SECRET_KEY=projects/centrifuge-production/secrets/SHUFTI_PRO_SECRET_KEY
SHUFTI_PRO_CLIENT_ID=projects/centrifuge-production/secrets/SHUFTI_PRO_CLIENT_ID
JWT_SECRET=projects/centrifuge-production/secrets/JWT_SECRET
SENDGRID_API_KEY=projects/centrifuge-production/secrets/SENDGRID_API_KEY

==> onboarding-api/env-vars/production.secrets <==
SHUFTI_PRO_SECRET_KEY=projects/centrifuge-production/secrets/SHUFTI_PRO_SECRET_KEY
SHUFTI_PRO_CLIENT_ID=projects/centrifuge-production/secrets/SHUFTI_PRO_CLIENT_ID
JWT_SECRET=projects/centrifuge-production/secrets/JWT_SECRET
SENDGRID_API_KEY=projects/centrifuge-production/secrets/SENDGRID_API_KEY
```


## Test it!

After adding your vars and secret(s) file in your PR, look for your PR function in the Gcloud console and see if the env and secrets you expect are there.
If the function fails to deploy make sure the secrets exist, and there's at least one version (v0) of the secrets uploaded. The function logs should tell you which secret/var is missing.