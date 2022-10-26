import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { InteractiveCard, Shelf, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePoolMetadata } from '../utils/usePools'
import { useCentrifuge } from './CentrifugeProvider'
import { LabelValueStack } from './LabelValueStack'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: Pool
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool }) => {
  const cent = useCentrifuge()
  const history = useHistory()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''
  const { data: metadata } = usePoolMetadata(pool)

  const totalTrancheCapacity = pool.tranches.reduce((prev, curr) => {
    return new CurrencyBalance(prev.add(curr.capacity), pool.currencyDecimals)
  }, CurrencyBalance.fromFloat(0, pool.currencyDecimals))

  return (
    <InteractiveCard
      icon={
        metadata?.pool?.icon?.uri ? (
          <img src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)} alt="" height="40" width="40" />
        ) : (
          <Thumbnail type="pool" label="LP" size="large" />
        )
      }
      variant="button"
      title={metadata?.pool?.name}
      subtitle={metadata?.pool?.issuer.name}
      onClick={() => history.push(`${basePath}/${pool.id}`)}
      secondaryHeader={
        <Shelf gap="6" justifyContent="flex-start">
          <LabelValueStack
            label={<Tooltips type="valueLocked" variant="secondary" />}
            value={formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency)}
          />
          <LabelValueStack label="Tokens" value={pool.tranches.length} />
          <LabelValueStack
            label="Capacity"
            value={formatBalance(totalTrancheCapacity.toFloat() + pool.reserve.total.toFloat(), pool.currency)}
          />
        </Shelf>
      }
    />
  )
}
