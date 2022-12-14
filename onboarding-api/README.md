# Centrifuge Onboarding API V2

## Development

1. Install dependencies `yarn install`
2. Install firebase globally: `npm install -g firebase-tools`
3. Login to firebase `firebase login`
4. Create an env file from the provided example. The ShuftiPro keys can be found in the dashboard settings.
5. Start dev server with `yarn dev` [localhost:5001]

## Endpoints

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

### `GET: /businessVerificationConfirm`

KYB and AML verification

**Request headers**

```js
authorization: Bearer <jwt-signed-token>
cookies: "__session=..." // httpOnly cookie set on /businessVerification
```

**Response**

201 created
