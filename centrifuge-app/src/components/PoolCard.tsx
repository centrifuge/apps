import { CurrencyBalance, Pool, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { InteractiveCard, Shelf, TextWithPlaceholder, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { usePoolMetadata } from '../utils/usePools'
import { Eththumbnail } from './EthThumbnail'
import { LabelValueStack } from './LabelValueStack'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  // Not passing a pool shows a placeholder card
  pool?: Pool | TinlakePool
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool }) => {
  const cent = useCentrifuge()
  const history = useHistory()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''
  const { data: metadata } = usePoolMetadata(pool)

  const totalTrancheCapacity =
    pool &&
    (pool.tranches as Token[]).reduce((prev, curr) => {
      return new CurrencyBalance(prev.add(curr.capacity), pool.currency.decimals)
    }, CurrencyBalance.fromFloat(0, pool.currency.decimals))

  return (
    <InteractiveCard
      icon={
        <Eththumbnail show={pool?.id.startsWith('0x')}>
          {metadata?.pool?.icon?.uri ? (
            <img src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)} alt="" height="40" width="40" />
          ) : (
            <Thumbnail type="pool" label="LP" size="large" />
          )}
        </Eththumbnail>
      }
      variant="button"
      title={<TextWithPlaceholder isLoading={!metadata}>{metadata?.pool?.name}</TextWithPlaceholder>}
      subtitle={<TextWithPlaceholder isLoading={!metadata}>{metadata?.pool?.issuer.name}</TextWithPlaceholder>}
      onClick={pool ? () => history.push(`${basePath}/${pool.id}`) : undefined}
      secondaryHeader={
        <Shelf gap="6" justifyContent="flex-start">
          <LabelValueStack
            label={
              pool ? <Tooltips type="valueLocked" variant="secondary" props={{ poolId: pool.id }} /> : 'Value locked'
            }
            value={
              pool ? (
                formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency.symbol)
              ) : (
                <TextWithPlaceholder isLoading />
              )
            }
          />
          <LabelValueStack
            label="Tokens"
            value={pool ? pool.tranches.length : <TextWithPlaceholder isLoading width={2} variance={0} />}
          />
          <LabelValueStack
            label="Capacity"
            value={
              totalTrancheCapacity ? (
                formatBalance(totalTrancheCapacity.toFloat() + pool.reserve.total.toFloat(), pool.currency.symbol)
              ) : (
                <TextWithPlaceholder isLoading />
              )
            }
          />
        </Shelf>
      }
    />
  )
}
