import { Pool } from '@centrifuge/centrifuge-js'
import { InteractiveCard, Shelf, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router'
import { PoolMetadata } from '../types'
import { getAge } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useAverageMaturity } from '../utils/useAverageMaturity'
import { IssuerSection } from './IssuerSection'
import { LabelValueStack } from './LabelValueStack'
import { Tooltips } from './Tooltips'

type PoolCardProps = {
  pool: Pool
  metadata: Partial<PoolMetadata> | undefined
}

export const PoolCard: React.VFC<PoolCardProps> = ({ pool, metadata }) => {
  const avgMaturity = useAverageMaturity(pool.id)
  const history = useHistory()
  const { pathname } = useLocation()
  const basePath = `/${pathname.split('/').filter(Boolean)[0]}`

  return (
    <InteractiveCard
      icon={
        metadata?.pool?.icon ? (
          <img src={parseMetadataUrl(metadata?.pool?.icon || '')} alt="" height="24" width="24" />
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
