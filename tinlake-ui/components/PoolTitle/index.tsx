import BN from 'bn.js'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import { PoolState } from '../../ducks/pool'
import { PoolLink } from '../PoolLink'
import { Label } from '../PoolList/styles'

interface Props {
  pool: Pool | UpcomingPool
  page: string
  parentPage?: string
  parentPageHref?: string
}

const PoolTitle: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const isOversubscribed = (pool?.data && new BN(pool?.data.maxReserve).lte(new BN(pool?.data.reserve))) || false

  return (
    <Wrapper>
      <Icon
        src={
          props.pool.metadata.media?.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'
        }
      />
      <PageTitle>
        <PoolName>{props.pool.metadata.name}</PoolName>
        <PageName>
          {props.parentPage && props.parentPageHref && (
            <>
              <PoolLink href={props.parentPageHref}>{props.parentPage}</PoolLink> <Arrow>►</Arrow>{' '}
            </>
          )}
          {props.page}
        </PageName>
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

const PoolName = styled.h2`
  font-size: 13px;
  font-weight: bold;
  margin: 4px 0 0 0;
  color: #979797;
`

const PageName = styled.h1`
  font-size: 18px;
  font-weight: bold;
  margin: 0;

  a {
    color: #000;
    text-decoration: none;

    &:hover {
      color: #0828be;
    }
  }
`

const Arrow = styled.span`
  font-size: 13px;
  position: relative;
  top: -1px;
  color: #979797;
  margin: 0 4px;
`

const PoolLabel = styled.div`
  margin-top: 4px;
  margin-left: 8px;
`
