import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import { PoolState, PoolData } from '../../ducks/pool'
import { Label } from '../PoolList/styles'
import BN from 'bn.js'

interface Props {
  pool: Pool | UpcomingPool
  page: string
}

const PoolTitle: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined
  const isOversubscribed = (poolData && new BN(poolData.maxReserve).lte(new BN(poolData.reserve))) || false

  return (
    <Wrapper>
      <Icon
        src={
          props.pool.metadata.media?.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'
        }
      />
      <PageTitle>
        <PageName>{props.page}</PageName>
        <PoolName>{props.pool.metadata.name}</PoolName>
      </PageTitle>
      <PoolLabel>
        {props.pool.isUpcoming ? (
          <Label blue>Upcoming</Label>
        ) : (
          isOversubscribed && <Label orange>Oversubscribed</Label>
        )}
      </PoolLabel>
    </Wrapper>
  )
}

export default PoolTitle

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0 36px 8px;
`

const Icon = styled.img`
  width: 40px;
  height: 40px;
  margin: 4px 16px 0 0;
`

const PageTitle = styled.div`
  display: flex;
  flex-direction: column;
`

const PageName = styled.h1`
  font-size: 18px;
  font-weight: bold;
  margin: 0;
`

const PoolName = styled.h2`
  font-size: 13px;
  font-weight: bold;
  margin: 0;
  color: #979797;
`

const PoolLabel = styled.div`
  margin-top: 4px;
  margin-left: 8px;
`
