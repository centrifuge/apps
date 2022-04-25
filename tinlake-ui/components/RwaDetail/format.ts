import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'

const ONE_MILLION = new BN('1000000000000000000000000')

export const formatNumber = (amount?: BN | string | number): string => {
  if (typeof amount === 'undefined' || amount === '') return ''

  const bn = new BN(amount)

  if (bn.gte(ONE_MILLION)) {
    return `${addThousandsSeparators(toPrecision(baseToDisplay(bn, 24), 2))}M`
  }
  return `${addThousandsSeparators(toPrecision(baseToDisplay(bn, 21), 0))}K`
}
