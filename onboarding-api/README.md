# Centrifuge Onboarding API V2

Onboard to centrifuge app as an entity or individual to invest in pools. KYB/KYC managed externally by [ShuftiPro](https://shuftipro.com/).

The Onboarding API can be used to onboard as an entity or as an individual.

`globalSteps` are steps that only have to be completed once and can be reused for many pools. It includes the steps necessary to verify the identity of the investor. Entities must complete 2 additional steps.

`poolSteps` are the steps an investor must complete for every pool they wish to invest in. The steps are considered complete when the issuer approves the investors to be whitelisted. The approval will trigger a transaction to give the investor MemberListAdmin permission for the given pool (not available for Tinlake pools yet)

### Onboarding For Individuals

Individual onboarding must complete the following **global steps**:

1. verify their identity through ShuftiPros KYC check (`/startKyc` and `/setVerifiedIdentity`)
2. if they are a US based investor they must verify that they are accredited (`/verifyAccreditation`)
3. provide tax information (`/uploadTaxInfo`)
4. verify their email (`/verifyEmail`)

And the following **pool/tranche steps**:

1. sign the agreement between the issuer and the potential investor (`/signAndSendDocuments`)
2. wait for approval from issuer (`/updateInvestorStatus`)

### Onboarding For Entities

Entities onboarding must complete then same steps as an individual and a few additional steps

1. verify business information for KYB and AML checks (`/verifyBusiness`)
2. confirm the ultimate beneficial owners of the business (`/confirmOwners`)

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

## API

[Postman documentation](https://restless-shadow-832962.postman.co/workspace/Centrifuge-Onboarding~e1f28c05-747e-4f73-9b33-605bb79ce238/collection/3605507-54b6d640-8c74-4879-8393-1761ae56d705?action=share&creator=3605507)

Every endpoint expects a jwt signed bearer token to be passed in the headers.

```js
Authorization: Bearer <jwt-signed-token>
```

### Obtain a token

For EVM wallets:

1. Generate a unique nonce by hitting the endpoint `POST /nonce` with `body { address }`. The request will set an httpOnly cookie which will automatically be sent in step 3.
2. Use the library [siwe](https://docs.login.xyz/sign-in-with-ethereum/quickstart-guide/creating-siwe-messages) to sign and generate a message and signature. Be sure to use the nonce fetched in the previous step and the same address to create and sign the siwe message.
3. Send a `POST /authenticateWallet` with `body { message, signature }` to get the access token to be included in each request.

For Substrate wallets:

1. Use the library [jw3t](https://github.com/hamidra/jw3t) to generate a signed jw3t token
2. `POST /authenticateWallet` with `body { jwtToken }` will return the access token

To verify the token is not expired, call the `/verify` endpoint

### `POST: /verifyBusiness`

> Step 1 for KYB

KYB and AML verification. Creates the entity user.

**Request body**

```ts
{
    email: string
    businessName: string
    registrationNumber: string
    jurisdictionCode: string // e.g us_az
    dryRun?: boolean // mock KYB and AML
}
```

**Response**

200 ok

Returns the entity user object and sets the step `verifyBusiness` to true on successful KYB/AML check from Shufti.

```js
{
  // ...
	"globalSteps": {
		// ...
		"verifyBusiness": {
			"completed": true,
			"timeStamp": "2023-01-23T20:56:50.039Z"
		}
	},
  // ...
}
```

### `POST: /confirmOwners`

> Step 2 for KYB

Sets the ultimate beneficial owners for the entity.

**Request body**

`ultimateBeneficialOwners` is required and will accept an array with max length of 3.

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

```js
{
  // ...
	"globalSteps": {
		// ...
		"confirmOwners": {
			"completed": true,
			"timeStamp": "2023-01-23T20:56:50.039Z"
		}
	},
  "ultimateBeneficialOwners": [
    {
      "dateOfBirth": "2023-01-05T20:40:19.447Z",
			"name": "Aaron"
		}
	],
  // ...
}
```

### `POST: /startKyc`

> Step 3 in KYB.
> Step 1 in KYC.

**Request body**

```ts
{
  name: string,
  dateOfBirth: string,
  countryOfCitizenship: string
}
```

**Response**

```json
{
  "reference": "KYC_0123",
  "event": "request.pending",
  "verification_url": "<iFrame URL>",
  "email": "",
  "country": ""
}
```

### `POST: /setVerifiedIdentity`

> Step 4 in KYB.
> Step 2 in KYC.

**Request body**

```ts
{
  dryRun: boolean // mocks requests to shuftiPro
}
```

**Response**

```js
{
  // ...
	"globalSteps": {
		// ...
		"verifyIdentity": {
			"completed": true,
			"timeStamp": "2023-01-23T20:56:50.039Z"
		}
	},
  // ...
}
```

### `POST: /signAgreement`

> Step 8 in KYB (US), Step 7 in KYB (non-US) — Step 6 in KYC (US), Step 5 in KYC (non-US).

**Request body**

```ts
{
  poolId: string,
  trancheId: string,
}
```

**Response**

```js
{
    // ...
    "poolSteps": {
      [poolId]: {
        [trancheId]: {
          "signAgreement" {
            "completed": true,
            "timeStamp": "2023-01-23T20:56:50.039Z",
            "transactionInfo": {
                "blockNumber": null,
                "extrinsicHash": null
              }
          }
        }
      }
    }
}
```

### `GET: /unsignedAgreement`

> Unsigned subscription agreement

**Query params**

```ts
{
  poolId: string,
  trancheId: string,
}
```

**Response**

```js
{
  unsignedAgreement: Buffer
}
```

### `GET: /signedAgreement`

> Signed subscription agreement

**Query params**

```ts
{
  poolId: string,
  trancheId: string,
}
```

**Response**

```js
{
  signedAgreement: Buffer
}
```

### `GET: /getUser`

**Response**

> Entity user example object:

```json
{
  "businessName": "Test Inc",
  "countryOfCitizenship": "CH",
  "investorType": "entity",
  "email": "test@centrifuge.io",
  "wallet": [
    {
    "address": "4g8zNcypnFHE5jqCifLGYoutCCM7uKWhF1NjWHka29hQE2rx",
    "network": "polkadot"
    }
  ],
  "registrationNumber": "710794409",
  "name": "Tester",
  "jurisdictionCode": "ch",
  "ultimateBeneficialOwners": [
    {
      "dateOfBirth": "2023-01-05T20:40:19.447Z",
      "name": "Aaron"
    }
  ],
  "incorporationDate": "2021-04-11",
  "dateOfBirth": "2021-04-11",
  "globalSteps": {
    "verifyIdentity": {
      "timeStamp": "2023-01-23T20:57:44.140Z",
      "completed": true
    },
    "verifyEmail": {
      "timeStamp": null,
      "completed": false
    },
    "verifyBusiness": {
      "completed": true,
      "timeStamp": "2023-01-23T20:56:50.039Z"
    },
    "confirmOwners": {
      "completed": true,
      "timeStamp": "2023-01-23T20:56:52.734Z"
    },
    "poolSteps": {
        "123abc": {
          "0x123456": {
            "signAgreement": {
              "timeStamp": null,
              "completed": false,
              "transactionInfo": {
                "blockNumber": null,
                "extrinsicHash": null
              }
            }
          }
        }
      }
    }
  }
}
```

## Whitelisting Investors

Once onboarding is complete a final tx will be signed by the server which will whtielist investors. For this, a pure proxy must be created and sufficiently funded for each chain environment. The pure proxy only has to be created once and can be used for all pools.

After creating the pure proxy, it must then be given `MemberListAdmin` permissions for each pool by the address with `PoolAdmin` permissions.

## Endpoints

Deployment strategy:
https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?both#Desired-deployment-workflow

DEV: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-dev
DEMO: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-demo
CATALYST: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-catalyst
ALTAIR: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api-altair
CENTRIFUGE: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api

Code Ref: https://github.com/centrifuge/apps/blob/fff5a5b8928a4e75419931f11a73cc0c91d5230b/.github/workflows/onboarding-api.yml#L126
