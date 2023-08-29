import {
  combine,
  combineAsync,
  imageFile,
  integer,
  isin,
  max,
  maxDecimals,
  maxFileSize,
  maxImageSize,
  maxLength,
  mimeType,
  minLength,
  nonNegativeNumber,
  pattern,
  positiveNumber,
  required,
} from '../../utils/validation'

export const MB = 1024 ** 2

export const validate = {
  nftImage: combine(imageFile(), maxFileSize(1 * MB)),

  poolName: combine(required(), maxLength(100)),
  poolIcon: combine(required(), mimeType('image/svg+xml', 'Icon must be an SVG file')),
  assetClass: required(),
  maxReserve: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  podEndpoint: pattern(/^https?:\/\/.{4,}/, 'Not a valid URL'),

  epochHours: combine(required(), nonNegativeNumber(), integer(), max(24 * 7 /* 1 week */)),
  epochMinutes: combine(required(), nonNegativeNumber(), integer(), max(59)),
  currency: required(),

  issuerName: combine(required(), maxLength(100)),
  issuerRepName: combine(required(), maxLength(100)),
  issuerDescription: combine(minLength(100), maxLength(1000)),
  issuerLogo: combineAsync(imageFile(), maxFileSize(1 * MB), maxImageSize(480, 480)),
  executiveSummary: combine(required(), mimeType('application/pdf'), maxFileSize(5 * MB)),
  website: combine(required(), pattern(/^https?:\/\/.{4,}/, 'Not a valid URL')),
  forum: pattern(/^https?:\/\/.{4,}/, 'Not a valid URL'),
  email: combine(pattern(/@/, 'Not a valid email address'), required()),
  issuerDetailTitle: combine(required(), maxLength(50)),
  issuerDetailBody: combine(required(), maxLength(3000)),

  // tranches
  tokenName: combine(required(), maxLength(30)),
  symbolName: combine(required(), maxLength(12)),
  minInvestment: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  interestRate: combine(required(), positiveNumber(), max(Number.MAX_SAFE_INTEGER)),
  minRiskBuffer: combine(required(), positiveNumber(), max(100)),

  // risk groups
  groupName: maxLength(30),
  advanceRate: combine(required(), positiveNumber(), max(100)),
  fee: combine(required(), positiveNumber(), max(100), maxDecimals(2)),
  probabilityOfDefault: combine(required(), nonNegativeNumber(), max(100)),
  discountRate: combine(required(), nonNegativeNumber(), max(100)),
  lossGivenDefault: combine(required(), nonNegativeNumber(), max(100)),
  maxBorrowQuantity: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  Isin: combine(required(), minLength(12), maxLength(12), isin()),
  maturityExtensionDays: combine(required(), positiveNumber(), max(365 * 2 /* 2 years */)),

  // write-off groups
  days: combine(required(), integer(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  writeOff: combine(required(), positiveNumber(), max(100)),
  penaltyInterest: combine(required(), nonNegativeNumber(), max(100)),
}
