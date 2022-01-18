import { PoolFormValues } from '.'

export const validateForm = (values: PoolFormValues) => {
  const errors = {
    tranches: [{ tokenName: 'AIAIAIA' }],
  }

  return errors
}
