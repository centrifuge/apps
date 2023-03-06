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
CATALYST: https://europe-central2-peak-vista-185616.cloudfunctions.net/onboarding-api-catalyst
ALTAIR: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api-altair
CENTRIFUGE: https://europe-central2-centrifuge-production-x.cloudfunctions.net/onboarding-api

Code Ref: https://github.com/centrifuge/apps/blob/fff5a5b8928a4e75419931f11a73cc0c91d5230b/.github/workflows/onboarding-api.yml#L126

Every endpoint expects a jw3t signed bearer token to be passed in the headers.

```js
authorization: Bearer <jwt-signed-token>
```

### `POST: /verifyBusiness`

> Step 1 for KYB

KYB and AML verification.

**Request body**

```ts
{
    email: string
    businessName: string
    incorporationDate: string // timestamp
    registrationNumber: string
    jurisdictionCode: string // e.g us_az
    trancheId: string
    poolId: string
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

> Step 3 in KYB. Step 1 in KYC.

**Request body**

```ts
{
  name: string,
  dateOfBirth: string,
  countryOfCitizenship: string
  poolId?: string // pass poolId only for KYC step 1
	trancheId?: string // pass trancheId only for KYC step 1
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

> Step 4 in KYB. Step 2 in KYC.

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

### `GET: /getUser`

**Response**

> Entity user example object:

```json
{
  "businessName": "Test Inc",
  "countryOfCitizenship": "CH",
  "investorType": "entity",
  "email": "test@centrifuge.io",
  "wallet": {
    "address": "4g8zNcypnFHE5jqCifLGYoutCCM7uKWhF1NjWHka29hQE2rx",
    "network": "polkadot"
  },
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

## Whitelisting Investors

Once onboarding is complete a final tx will be signed by the server which will whtielist investors. For this, a pure proxy must be created and sufficiently funded for each chain environment. The pure proxy only has to be created once and can be used for all pools.

After creating the pure proxy, it must then be given `MemberListAdmin` permissions for each pool by the address with `PoolAdmin` permissions.
