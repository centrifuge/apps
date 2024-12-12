import { FormikErrors, setIn } from 'formik'
import { isSubstrateAddress } from '../../../src/utils/address'
import {
  combine,
  combineAsync,
  imageFile,
  integer,
  isin,
  maturityDate,
  max,
  maxDecimals,
  maxFileSize,
  maxImageSize,
  maxLength,
  mimeType,
  min,
  minLength,
  nonNegativeNumber,
  pattern,
  positiveNumber,
  required,
} from '../../utils/validation'
import { CreatePoolValues } from './types'

export const MB = 1024 ** 2

export const validate = {
  nftImage: combine(imageFile(), maxFileSize(1 * MB)),

  // pool structure
  poolStructure: required(),
  trancheStructure: required(),
  assetClass: required(),
  subAssetClass: required(),
  currency: required(),

  // tranches
  tokenName: combine(required(), maxLength(100)),
  symbolName: combine(required(), maxLength(12)),
  minInvestment: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  interestRate: combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER)),
  minRiskBuffer: combine(required(), positiveNumber(), max(100)),
  maxPriceVariation: combine(required(), min(0), max(10000)),
  maturityDate: combine(required(), maturityDate()),
  apy: required(),
  apyPercentage: required(),

  // pool details
  poolName: combine(required(), maxLength(100)),
  poolIcon: combine(required(), mimeType('image/svg+xml', 'Icon must be an SVG file')),
  maxReserve: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  investorType: required(),
  poolType: required(),

  epochHours: combine(required(), nonNegativeNumber(), integer(), max(24 * 7 /* 1 week */)),
  epochMinutes: combine(required(), nonNegativeNumber(), integer(), max(59)),

  issuerName: combine(required(), maxLength(100)),
  issuerRepName: combine(required(), maxLength(100)),
  issuerDescription: combine(minLength(100), maxLength(1000)),
  issuerShortDescription: combine(minLength(50), maxLength(100)),
  issuerLogo: combineAsync(imageFile(), maxFileSize(1 * MB), maxImageSize(480, 480)),
  executiveSummary: combine(required(), mimeType('application/pdf'), maxFileSize(5 * MB)),
  website: combine(required(), pattern(/^https?:\/\/.{4,}/, 'Not a valid URL')),
  websiteNotRequired: combine(pattern(/^https?:\/\/.{4,}/, 'Not a valid URL')),
  forum: pattern(/^https?:\/\/.{4,}/, 'Not a valid URL'),
  email: combine(pattern(/@/, 'Not a valid email address'), required()),
  issuerDetailTitle: combine(required(), maxLength(50)),
  issuerDetailBody: combine(required(), maxLength(3000)),

  // risk groups
  groupName: maxLength(30),
  advanceRate: combine(required(), positiveNumber(), max(100)),
  fee: combine(required(), positiveNumber(), max(100), maxDecimals(2)),
  probabilityOfDefault: combine(required(), nonNegativeNumber(), max(100)),
  discountRate: combine(required(), nonNegativeNumber(), max(100)),
  lossGivenDefault: combine(required(), nonNegativeNumber(), max(100)),
  maxBorrowQuantity: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  isin: combine(required(), minLength(12), maxLength(12), isin()),
  maturityExtensionDays: combine(required(), nonNegativeNumber(), max(365 * 2 /* 2 years */)),

  // write-off groups
  days: combine(required(), integer(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  writeOff: combine(required(), positiveNumber(), max(100)),
  penaltyInterest: combine(required(), nonNegativeNumber(), max(100)),

  addressValidate: required(),
  externalOnboardingUrl: required(),
}

export const validateValues = (values: CreatePoolValues) => {
  let errors: FormikErrors<any> = {}

  const tokenNames = new Set<string>()
  const commonTokenSymbolStart = values.tranches[0].symbolName.slice(0, 3)
  const tokenSymbols = new Set<string>()
  let prevInterest = Infinity
  let prevRiskBuffer = 0

  const juniorInterestRate =
    values.tranches[0].apyPercentage !== null ? parseFloat(values.tranches[0].apyPercentage.toString()) : 0

  if (values.issuerCategories.length > 1) {
    values.issuerCategories.forEach((category, i) => {
      console.log(category)
      if (category.type === '') {
        errors = setIn(errors, `issuerCategories.${i}.type`, 'Type is required')
      }
      if (category.value === '') {
        errors = setIn(errors, `issuerCategories.${i}.value`, 'Name of provider is required')
      }
      if (category.type === 'other' && category.description === '') {
        errors = setIn(errors, `issuerCategories.${i}.description`, 'Field is required')
      }
    })
  }

  if (values.poolRatings.length > 1) {
    values.poolRatings.forEach((rating, i) => {
      console.log(rating)
      if (rating.agency === '') {
        errors = setIn(errors, `poolRatings.${i}.agency`, 'Field is required')
      }
      if (rating.value === '') {
        errors = setIn(errors, `poolRatings.${i}.value`, 'Field is required')
      }
      if (rating.reportUrl === '') {
        errors = setIn(errors, `poolRatings.${i}.reportUrl`, 'Field is required')
      }
      if (rating.reportFile === null) {
        errors = setIn(errors, `poolRatings.${i}.reportFile`, 'Field is required')
      }
    })
  }

  if (values.adminMultisigEnabled) {
    values.adminMultisig.signers.forEach((signer, i) => {
      if (!isSubstrateAddress(signer) && signer !== '') {
        errors = setIn(errors, `adminMultisig.signers.${i}`, 'Invalid address')
      }
    })
  }

  values.poolFees.forEach((fee, i) => {
    if (fee.name === '' && i !== 0) {
      errors = setIn(errors, `poolFees.${i}.name`, 'Name is required')
    }
    if (fee.percentOfNav === 0 || fee.percentOfNav < 0.0001 || fee.percentOfNav > 10) {
      errors = setIn(errors, `poolFees.${i}.percentOfNav`, 'Percentage between 0.0001 and 10 is required')
    }
    if (fee.walletAddress === '') {
      errors = setIn(errors, `poolFees.${i}.walletAddress`, 'Wallet address is required')
    }
    if (!isSubstrateAddress(fee?.walletAddress)) {
      errors = setIn(errors, `poolFees.${i}.walletAddress`, 'Invalid address')
    }
  })

  values.assetOriginators.forEach((asset, i) => {
    if (!isSubstrateAddress(asset) && asset !== '') {
      errors = setIn(errors, `assetOriginators.${i}`, 'Invalid address')
    }
  })

  values.tranches.forEach((t, i) => {
    if (tokenNames.has(t.tokenName)) {
      errors = setIn(errors, `tranches.${i}.tokenName`, 'Tranche names must be unique')
    }
    tokenNames.add(t.tokenName)

    // matches any character thats not alphanumeric or -
    if (/[^a-z^A-Z^0-9^-]+/.test(t.symbolName)) {
      errors = setIn(errors, `tranches.${i}.symbolName`, 'Invalid character detected')
    }

    if (tokenSymbols.has(t.symbolName)) {
      errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must be unique')
    }
    tokenSymbols.add(t.symbolName)

    if (t.symbolName.slice(0, 3) !== commonTokenSymbolStart) {
      errors = setIn(errors, `tranches.${i}.symbolName`, 'Token symbols must all start with the same 3 characters')
    }

    if (i > 0 && t.interestRate !== '') {
      if (t.interestRate > juniorInterestRate) {
        errors = setIn(
          errors,
          `tranches.${i}.interestRate`,
          "Interest rate can't be higher than the junior tranche's target APY"
        )
      }
      if (t.interestRate > prevInterest) {
        errors = setIn(errors, `tranches.${i}.interestRate`, "Can't be higher than a more junior tranche")
      }
      prevInterest = t.interestRate
    }

    if (t.minRiskBuffer !== '') {
      if (t.minRiskBuffer < prevRiskBuffer) {
        errors = setIn(errors, `tranches.${i}.minRiskBuffer`, "Can't be lower than a more junior tranche")
      }
      prevRiskBuffer = t.minRiskBuffer
    }
  })

  return errors
}
