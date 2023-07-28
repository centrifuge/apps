import * as React from 'react'
import { useTinlakeUserRewards } from '../../utils/tinlake/useTinlakeRewards'
import { useAddress } from '../../utils/useAddress'
import { ClaimTinlakeRewards } from './ClaimTinlakeRewards'

export function TinlakeRewards() {
  const address = useAddress('evm')
  const { data: tinlakeUserRewards } = useTinlakeUserRewards(address)

  return tinlakeUserRewards?.links.length ? <ClaimTinlakeRewards /> : null
}
