const getError = (defaultError: string, err: CustomError | undefined, val: string) => {
  switch (typeof err) {
    case 'undefined':
      return defaultError
    case 'string':
      return err
    default:
      return err(val)
  }
}

export const required = () => (val?: string, err?: CustomError) =>
  val ? '' : getError(`The field is required`, err, val || '')

export const pattern =
  (regexp: RegExp, err?: CustomError) =>
  (val?: string): string =>
    typeof val === 'string' && val.match(regexp) ? '' : getError(`The input doesn't match ${regexp}`, err, val || '')

export const minLength = (minValue: number, err?: CustomError) => (val?: string) =>
  typeof val === 'string' && val.length >= minValue
    ? ''
    : getError(`Minimum length: ${minValue} characters`, err, val || '')

export const maxLength = (maxValue: number, err?: CustomError) => (val?: string) =>
  typeof val === 'string' && val.length <= maxValue
    ? ''
    : getError(`Maximum length: ${maxValue} characters`, err, val || '')

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
  (...funcs: ((val?: string) => string)[]) =>
  (val?: string) =>
    funcs.reduce((err, func) => err || func(val), '')

type CustomError = string | ((val?: string) => string)
