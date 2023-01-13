# Centrifuge Onboarding API V2

## Development

1. Install dependencies `yarn install`
2. Make sure gcloud CLI is installed and you have sufficient permissions.
3. Authenticate your user and then set the application default
   ```sh
   gcloud auth login
   gcloud auth application-default login
   ```
4. Create an env file from the provided example. The ShuftiPro keys can be found in the dashboard settings.
5. Start dev server with `yarn develop` [localhost:8080]

## Endpoints
Deployment strategy:
https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?both#Desired-deployment-workflow

DEV: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-dev
DEMO: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-demo
DEMO: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-catalyst
ALTAIR: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api-altair
CENTRIFUGE: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api

Code Ref: https://github.com/centrifuge/apps/blob/fff5a5b8928a4e75419931f11a73cc0c91d5230b/.github/workflows/onboarding-api.yml#L126


### `POST: /businessVerification`

KYB and AML verification

**Request headers**

```js
authorization: Bearer <jwt-signed-token>
```

**Request body**

```ts
{
    email: string
    businessName: string
    businessIncorporationDate: string // timestamp
    companyRegistrationNumber: string
    companyJurisdictionCode: string // e.g az_us
    trancheId: string
    poolId: string
    address: string
    dryRun?: boolean // mock KYB and AML
}
```

**Response**

200 ok

An httpOnly cookie is set that is required to confirm business ownership in the next step (`/businessVerificationConfirm`)

```js
// ...
ultimateBeneficialOwners: [],
steps: {
    email: {
        verificationCode: "",
        verified: false
    },
    kyb: {
        requested: true,
        verified: false
    },
    kyc: {
        verified: false,
        users: []
    }
}
```

### `POST: /businessVerificationConfirm`

Confirm AML and KYB and update UBOs

**Request headers**

```js
authorization: Bearer <jwt-signed-token>
cookies: "__session=..." // httpOnly cookie set on /businessVerification
```

**Request body**

`ultimateBeneficialOwners` is required and will accept an array with max length of 3. A UBO must hold at least 25% of the company shares.

```ts
{
    ultimateBeneficialOwners: [
        {
            name: string,
            dateOfBirth: Date (iso string)
        }
    ]
}
```

**Response**

200 ok
