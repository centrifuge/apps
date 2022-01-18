export const validateFloatNumber = (value: string) => {
  if (!value) return
  if (!value.trim().match(/^[0-9]+(\.[0-9]+)?$/)) {
    return 'Must be a number'
  }
}

export const validateNonEmptyString = (value: string) => {
  if (!value || value.trim() === '') {
    return 'This field is required'
  }
}
