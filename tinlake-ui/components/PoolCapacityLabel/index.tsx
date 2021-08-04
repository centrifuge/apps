import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import * as React from 'react'
import styled from 'styled-components'
import { PoolData } from '../../ducks/pools'

interface Props {
  pool: PoolData
}

export const PoolCapacityLabel: React.FC<Props> = ({ pool: p }) => {
  return p.isUpcoming || (!p.assetValue && !p.reserve) || (p.assetValue?.isZero() && p.reserve?.isZero()) ? (
    <Label blue>Upcoming</Label>
  ) : p.isArchived ? (
    <Label>Archived</Label>
  ) : p.isOversubscribed ? (
    <Label orange>Oversubscribed</Label>
  ) : (
    <Label green>
      {addThousandsSeparators(toPrecision(baseToDisplay(p.capacity || new BN(0), 21), 0))}K {p.currency}
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
