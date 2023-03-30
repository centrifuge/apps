import { isAddress } from '@polkadot/util-crypto'
import Decimal from 'decimal.js-light'
import { getImageDimensions } from '../getImageDimensions'

const MB = 1024 ** 2

const isImageFile = (file: any): boolean => file instanceof File && !!file.type.match(/^image\//)

const getError = (defaultError: string, err: CustomError | undefined, val: any) => {
  switch (typeof err) {
    case 'undefined':
      return defaultError
    case 'string':
      return err
    default:
      return err(val)
  }
}

export const required = (err?: CustomError) => (val?: any) =>
  val != null && val !== '' ? '' : getError(`This field is required`, err, val)

export const nonNegativeNumber = (err?: CustomError) => (val?: any) => {
  const num = val instanceof Decimal ? val.toNumber() : val
  return Number.isFinite(num) && num >= 0 ? '' : getError(`Value must be positive`, err, num)
}

export const positiveNumber = (err?: CustomError) => (val?: any) => {
  const num = val instanceof Decimal ? val.toNumber() : val
  return Number.isFinite(num) && num > 0 ? '' : getError(`Value must be positive`, err, num)
}

export const maxDecimals = (decimals: number, err?: CustomError) => (val?: any) => {
  const num = val instanceof Decimal ? val.toNumber() : val
  return Number.isFinite(num) && roundToFraction(num, decimals) === num
    ? ''
    : getError(`Max ${decimals} decimals`, err, num)
}

const roundToFraction = (n: number, d: number) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d)

export const integer = (err?: CustomError) => (val?: any) =>
  Number.isFinite(val) && Math.floor(val) === val ? '' : getError(`Value must whole number`, err, val)

export const min = (minValue: number, err?: CustomError) => (val?: any) => {
  const num = val instanceof Decimal ? val.toNumber() : val
  return num >= minValue ? '' : getError(`Value needs to be larger than ${minValue}`, err, num)
}

export const max = (maxValue: number, err?: CustomError) => (val?: any) => {
  const num = val instanceof Decimal ? val.toNumber() : val
  return num <= maxValue ? '' : getError(`Value too large`, err, num)
}

export const maxFileSize = (maxBytes: number, err?: CustomError) => (val?: any) => {
  return val instanceof File && val.size > maxBytes
    ? getError(`File too large. The maximum file size is ${maxBytes / MB} MB.`, err, val)
    : ''
}

export const mimeType = (type: RegExp | string, err?: CustomError) => (val?: any) => {
  return val instanceof File && (typeof type === 'string' ? type !== val.type : !type.test(val.type))
    ? getError(`Invalid valid type`, err, val)
    : ''
}

export const imageFile = (err?: CustomError) => {
  return mimeType(/^image\//, err)
}

export const maxImageSize = (maxWidth: number, maxHeight: number, err?: CustomError) => async (val?: any) => {
  if (!isImageFile(val)) return ''
  const [width, height] = await getImageDimensions(val)
  return width > maxWidth || height > maxHeight
    ? getError(`Image too large. max: ${maxWidth}x${maxHeight}px`, err, val)
    : ''
}

export const pattern =
  (regexp: RegExp, err?: CustomError) =>
  (val?: string): string =>
    !val || (typeof val === 'string' && val.match(regexp))
      ? ''
      : getError(`The input doesn't match ${regexp}`, err, val || '')

export const minLength = (minValue: number, err?: CustomError) => (val?: string) =>
  typeof val === 'string' && val.length >= minValue
    ? ''
    : getError(`Needs to be at least ${minValue} characters`, err, val || '')

export const maxLength = (maxValue: number, err?: CustomError) => (val?: string) =>
  typeof val === 'string' && val.length <= maxValue
    ? ''
    : getError(`Needs to be less than ${maxValue} characters`, err, val || '')

export const address = (err?: CustomError) => (val?: string) => (
  console.log('isAddress(val)', isAddress(val), val),
  val && !isAddress(val) ? getError('Invalid address', err, val || '') : ''
)

export const oneOf = (valuesArray: unknown[], err?: CustomError) => (val?: string) =>
  valuesArray.indexOf(val) !== -1 ? '' : getError(`Value must be one of: ${valuesArray.join(', ')}`, err, val || '')

/**
 * Returns a combination of validation functions.
 * The returned function runs each validation function in sequence
 * against the value, and return the first error encountered, or empty string
 * if all the validators return no error
 * @param {...function} funcs validation functions to combine
 * @return {function} a new validation function which is the combination
 * of the parameters.
 */
export const combine =
  (...funcs: ((val?: any) => string)[]) =>
  (val?: any) =>
    funcs.reduce((err, func) => err || func(val), '')

export const combineAsync =
  (...funcs: ((val?: any) => string | Promise<string>)[]) =>
  async (val?: any) => {
    for (const func of funcs) {
      const res = await func(val)
      if (res) return res
    }
    return ''
  }

type CustomError = string | ((val?: any) => string)

export const isValidJsonString = (str: string) => {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}
