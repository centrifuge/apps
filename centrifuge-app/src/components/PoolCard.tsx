import { Pool } from '@centrifuge/centrifuge-js'
import { PoolMetadata } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { InteractiveCard, Shelf, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { getAge } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { useAverageMaturity } from '../utils/useAverageMaturity'
import { useCentrifuge } from './CentrifugeProvider'
import { IssuerSection } from './IssuerSection'
import { LabelValueStack } from './LabelValueStack'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: Pool
  metadata: Partial<PoolMetadata> | undefined
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const avgMaturity = useAverageMaturity(pool.id)
  const cent = useCentrifuge()
  const history = useHistory()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''

  return (
    <InteractiveCard
      icon={
        metadata?.pool?.icon ? (
          <img
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon.uri ?? metadata?.pool?.icon)}
            alt=""
            height="24"
            width="24"
          />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )
      }
      variant="button"
      title={metadata?.pool?.name}
      onClick={() => history.push(`${basePath}/${pool.id}`)}
      secondaryHeader={
        <Shelf gap="6" justifyContent="flex-start">
          <LabelValueStack
            label={<Tooltips type="valueLocked" variant="secondary" />}
            value={formatBalance(pool.nav.latest.toFloat() + pool.reserve.total.toFloat(), pool.currency)}
          />
          <LabelValueStack label={<Tooltips type="age" variant="secondary" />} value={getAge(pool?.createdAt)} />
          <LabelValueStack label={<Tooltips type="averageAssetMaturity" variant="secondary" />} value={avgMaturity} />
        </Shelf>
      }
    >
      <IssuerSection metadata={metadata} />
    </InteractiveCard>
  )
}
