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
    : getError(`Needs to be at most ${maxValue} characters`, err, val || '')

export const address = (err?: CustomError) => (val?: string) =>
  val && !isAddress(val) ? getError('Invalid address', err, val || '') : ''

export const oneOf = (valuesArray: unknown[], err?: CustomError) => (val?: string) =>
  valuesArray.indexOf(val) !== -1 ? '' : getError(`Value must be one of: ${valuesArray.join(', ')}`, err, val || '')

// Source: https://gist.github.com/simonellistonball/8822244
const calcISINCheck = (code: string) => {
  let conv = ''
  let digits = ''
  let sd = 0

  // convert letters
  for (let i = 0; i < code.length; i++) {
    let c = code.charCodeAt(i)
    conv += c > 57 ? (c - 55).toString() : code[i]
  }
  // group by odd and even, multiply digits from group containing rightmost character by 2
  for (let i = 0; i < conv.length; i++) {
    digits += (parseInt(conv[i]) * (i % 2 == (conv.length % 2 != 0 ? 0 : 1) ? 2 : 1)).toString()
  }
  // sum all digits
  for (let i = 0; i < digits.length; i++) {
    sd += parseInt(digits[i])
  }
  // subtract mod 10 of the sum from 10, return mod 10 of result
  return (10 - (sd % 10)) % 10
}

export const isin = (err?: CustomError) => (val?: any) => {
  // basic pattern
  const regex =
    /(AD|AE|AF|AG|AI|AL|AM|AO|AQ|AR|AS|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BJ|BL|BM|BN|BO|BQ|BR|BS|BT|BV|BW|BY|BZ|CA|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|CR|CU|CV|CW|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EE|EG|EH|ER|ES|ET|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|IO|IQ|IR|IS|IT|JE|JM|JO|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MF|MG|MH|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NC|NE|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|SS|ST|SV|SX|SY|SZ|TC|TD|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TR|TT|TV|TW|TZ|UA|UG|UM|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|YE|YT|ZA|ZM|ZW)([0-9A-Z]{9})([0-9])/gm

  const match = regex.exec(val.toString())
  console.log(match)
  if (match?.length !== 4) return getError(`Not a valid ISIN`, err, val)

  // validate the check digit
  return match[3] === calcISINCheck(match[1] + match[2]).toString() ? '' : getError(`Not a valid ISIN`, err, val)
}

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
