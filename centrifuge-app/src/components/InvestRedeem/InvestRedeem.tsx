import { ConnectionGuard, useGetNetworkName } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { LoadBoundary } from '../LoadBoundary'
import { InvestRedeemState } from './InvestRedeemState'
import { InvestRedeemProps } from './types'

// @ts-ignore
const listFormatter = new Intl.ListFormat('en')

export function InvestRedeem({ networks = ['centrifuge'], ...rest }: InvestRedeemProps) {
  const getNetworkName = useGetNetworkName()
  return (
    <LoadBoundary>
      <ConnectionGuard
        networks={networks}
        body={`This pool is deployed on the ${listFormatter.format(networks.map(getNetworkName))} ${
          networks.length > 1 ? 'networks' : 'network'
        }. To be able to invest and redeem you need to switch the network.`}
      >
        <InvestRedeemState networks={networks} {...rest} />
      </ConnectionGuard>
    </LoadBoundary>
  )
}
