import {
  combine,
  combineAsync,
  imageFile,
  max,
  maxFileSize,
  maxImageSize,
  maxLength,
  mimeType,
  minLength,
  nonNegativeNumber,
  pattern,
  required,
} from '../../utils/validation'

const numWith2Decimals = pattern(/^\d+(\.\d{1,2})?$/, 'Please insert a number with up to 2 decimals')

const MB = 1024 ** 2

export const validate = {
  poolName: combine(required(), maxLength(100)),
  poolIcon: combine(mimeType('image/svg+xml', 'Icon must be an SVG file')),
  assetClass: required(),
  maxReserve: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),

  epochDuration: combine(required(), nonNegativeNumber(), max(24 * 7 /* 1 week */)),
  challengeTime: combine(required(), nonNegativeNumber(), max(60 * 24 /* 1 day */)),
  currency: required(),

  issuerName: combine(required(), maxLength(100)),
  issuerDescription: combine(minLength(100), maxLength(800)),
  issuerLogo: combineAsync(imageFile(), maxFileSize(5 * MB), maxImageSize(480, 480)),
  executiveSummary: combine(required(), mimeType('application/pdf'), maxFileSize(5 * MB)),
  website: pattern(/^https?:\/\/.{4,}/, 'Not a valid URL'),
  forum: pattern(/^https?:\/\/.{4,}/, 'Not a valid URL'),
  email: pattern(/@/, 'Not a valid email address'),

  // tranches
  tokenName: combine(required(), maxLength(30)),
  symbolName: combine(required(), maxLength(6)),
  minInvest: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  interestRate: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  minRiskBuffer: combine(required(), nonNegativeNumber(), max(100)),

  // risk groups
  groupName: maxLength(30),
  advanceRate: combine(required(), nonNegativeNumber(), max(100)),
  fee: combine(required(), nonNegativeNumber(), max(100)),
  probabilityOfDefault: combine(required(), nonNegativeNumber(), max(100)),
  discountRate: combine(required(), nonNegativeNumber(), max(100)),
  lossGivenDefault: combine(required(), nonNegativeNumber(), max(100)),

  // write-off groups
  days: combine(required(), nonNegativeNumber(), max(Number.MAX_SAFE_INTEGER)),
  writeOff: combine(required(), nonNegativeNumber(), max(100)),
}
