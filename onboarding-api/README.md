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

KYB and AML verification

**Request body**

```ts
{
    email: string
    businessName: string
    incorporationDate: string // timestamp
    registrationNumber: string
    jurisdictionCode: string // e.g az_us
    trancheId: string
    poolId: string
    dryRun?: boolean // mock KYB and AML
}
```

**Response**

200 ok

```js
{
	"user": {
		"pools": [
			{
				"poolId": "123abc",
				"investorType": "entity",
				"trancheId": "0x123456"
			}
		],
		"steps": [
			// ...
		],
		"business": {
			"jurisdictionCode": "us_ar",
			"businessName": "Walmart inc",
			"incorporationDate": "2021-04-11",
			"email": "info@centrifuge.io",
			"registrationNumber": "710794409",
			"ultimateBeneficialOwners": [],
			"steps": [
				{
					"completed": true, // set to true in request
					"step": "VerifyBusiness"
				},
			// ...
			]
		}
	}
}
```

### `POST: /confirmOwners`

Confirm AML and KYB and update UBOs

**Request body**

`ultimateBeneficialOwners` is required and will accept an array with max length of 3. A UBO must hold at least 25% of the company shares.

```ts
{
  	trancheId: string,
    poolId: string,
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
  "user": {
    // ...
    "pools": [
      {
        "investorType": "entity",
        "poolId": "123abc",
        "trancheId": "0x123456"
      }
    ],
    "steps": [
      // ...
    ]
  },
  "business": {
    // ...
    "steps": [
      // ...
      {
        "step": "ConfirmOwners",
        "completed": true // set to true in request
      }
    ]
  }
}
```

### `POST: /getUser`
