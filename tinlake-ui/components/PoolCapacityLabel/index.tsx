import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import * as React from 'react'
import styled from 'styled-components'
import { PoolData } from '../../utils/usePools'

interface Props {
  pool?: PoolData
}

const ONE_MILLION = new BN('1000000000000000000000000')

const formatCapacity = (capacity: BN): string => {
  if (capacity.gte(ONE_MILLION)) {
    return `${addThousandsSeparators(toPrecision(baseToDisplay(capacity, 24), 2))}M`
  }
  return `${addThousandsSeparators(toPrecision(baseToDisplay(capacity, 21), 0))}K`
}

export const PoolCapacityLabel: React.FC<Props> = ({ pool }) => {
  if (!pool) {
    return <Label green>Open</Label>
  }

  if (pool?.poolClosing) {
    return <Label orange>Closing down</Label>
  }

  if (pool?.isUpcoming) {
    return <Label blue>Upcoming</Label>
  }

  if (pool?.isArchived) {
    return <Label>Archived</Label>
  }

  if (pool?.isOversubscribed || pool?.capacity?.isZero()) {
    return <Label orange>Oversubscribed</Label>
  }

  if (pool?.capacity == null) {
    return null
  }

  return <Label green>{pool?.capacity ? `${formatCapacity(pool?.capacity)} ${pool?.currency}` : '...'}</Label>
}

const Label = styled.div<{ green?: true; blue?: true; orange?: true }>`
  height: 20px;
  font-weight: 500;
  font-size: 12px;
  line-height: 18px;
  color: white;
  padding: 0 8px 0 8px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
  color: ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
`
