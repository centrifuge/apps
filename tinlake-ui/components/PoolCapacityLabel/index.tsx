import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import * as React from 'react'
import styled from 'styled-components'
import { PoolData } from '../../ducks/pools'

interface Props {
  pool: PoolData
}

export const PoolCapacityLabel: React.FC<Props> = ({ pool }) => {
  const { assetValue, capacity, currency, isArchived, isOversubscribed, reserve } = pool

  const isUpcoming = pool.isUpcoming || (!assetValue && !reserve) || (assetValue?.isZero() && reserve?.isZero())

  if (isUpcoming) {
    return <Label blue>Upcoming</Label>
  }

  if (isArchived) {
    return <Label>Archived</Label>
  }

  if (isOversubscribed || pool.capacity?.isZero()) {
    return <Label orange>Oversubscribed</Label>
  }

  if (capacity == null) {
    return null
  }

  return (
    <Label green>
      {capacity
        ? `${addThousandsSeparators(toPrecision(baseToDisplay(capacity || new BN(0), 21), 0))}K ${currency}`
        : '...'}
    </Label>
  )
}

const Label = styled.div<{ green?: true; blue?: true; orange?: true }>`
  margin-left: 13px;
  position: relative;
  top: -2px;
  display: inline-block;
  height: 20px;
  font-weight: 500;
  font-size: 12px;
  color: white;
  padding: 0 8px 0 8px;
  text-align: center;
  border-radius: 12px;
  border: 1px solid ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
  color: ${({ green, blue, orange }) => (green ? '#598232' : blue ? '#2976D4' : orange ? '#9B6F2B' : '#666')};
`
