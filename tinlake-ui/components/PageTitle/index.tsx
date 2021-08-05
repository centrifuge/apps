import { LinkPrevious } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import { PoolsState } from '../../ducks/pools'
import { PoolCapacityLabel } from '../PoolCapacityLabel'
import { PoolLink } from '../PoolLink'

interface Props {
  pool?: Pool | UpcomingPool
  page: string
  parentPage?: string
  parentPageHref?: string
  rightContent?: React.ReactNode
  return?: boolean
}

const PageTitle: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  // TODO: This doesn't fetch the pools data itself, but gets the data because the PoolSelector fetches it.
  // Ideally, we don't want to rely on this data coincidentally being fetched elsewhere.
  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const poolData = pools.data?.pools.find((p) => p.id === router.query.root)
  const subgraphIsLoading = pools.data?.totalValue.isZero()

  return (
    <Wrapper>
      {props.return && (
        <BackLink onClick={() => router.back()}>
          <LinkPrevious style={{ cursor: 'pointer' }} />
        </BackLink>
      )}
      {!props.return && (
        <Icon
          src={
            props.pool?.metadata.media?.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'
          }
        />
      )}
      <Title>
        {props.pool && (
          <PoolName>
            {props.pool.metadata.name}
            <PoolLabel>{poolData && !subgraphIsLoading && <PoolCapacityLabel pool={poolData} />}</PoolLabel>
          </PoolName>
        )}
        {!props.pool && <PoolName>Tinlake</PoolName>}
        <PageName>
          {props.parentPage && props.parentPageHref && (
            <>
              <PoolLink href={props.parentPageHref}>{props.parentPage}</PoolLink> <Arrow>►</Arrow>{' '}
            </>
          )}
          {props.page}
        </PageName>
      </Title>
      {props.rightContent && <RightContent>{props.rightContent}</RightContent>}
    </Wrapper>
  )
}

export default PageTitle

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0 36px 8px;
`

const BackLink = styled.div`
  margin: 14px 20px 0 18px;
  > svg {
    width: 18px;
    height: 18px;
  }
`

const Icon = styled.img`
  width: 40px;
  height: 40px;
  margin: 4px 16px 0 0;
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
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
      color: rgb(39, 98, 255);
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
  margin-left: 8px;
  display: inline-block;
`

const RightContent = styled.div`
  margin-left: auto;
  flex: 1;
`
