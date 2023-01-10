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

Every endpoint expects a jw3t signed bearer token to be passed in the headers.

```js
authorization: Bearer <jwt-signed-token>
```

### `POST: /createUser`

Initializes user and business.

**Request body**

```ts
{
	investorType: 'entity' | 'individual'
	poolId: string
	trancheId: string
}
```

**Response**

```json
{
  "user": {
    "walletAddress": "4e",
    "pools": [
      {
        "investorType": "entity",
        "poolId": "123abc",
        "trancheId": "0x123456"
      }
    ],
    "steps": [
      {
        "step": "InvestorType",
        "completed": true // set to true in request
      }
      // ...
    ]
  },
  "business": {
    "walletAddress": "4exxx",
    "steps": [
      // ...
    ]
  }
}
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

```json
{
  "user": {
    "walletAddress": "4e",
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
    "walletAddress": "4exxx",
    "steps": [
      // ...
      {
        "step": "VerifyBusiness",
        "completed": true // set to true in request
      }
    ]
  }
}
```

### `POST: /verifyBusinessConfirm`

Confirm AML and KYB and update UBOs

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

```json
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
