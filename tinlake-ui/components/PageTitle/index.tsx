import { LinkPrevious } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import { usePools } from '../../utils/usePools'
import { Box, Shelf } from '../Layout'
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
  const pools = usePools()
  const poolData = pools.data?.pools.find((p) => p.id === router.query.root)

  return (
    <Shelf justifyContent="space-between" mb="xlarge">
      {props.return ? (
        <BackLink onClick={() => router.back()}>
          <LinkPrevious style={{ cursor: 'pointer' }} />
        </BackLink>
      ) : (
        <Icon
          src={
            props.pool?.metadata.media?.icon || 'https://storage.googleapis.com/tinlake/pool-media/icon-placeholder.svg'
          }
        />
      )}
      <Title>
        {props.pool ? (
          <Shelf gap="xsmall">
            <PoolName>{props.pool.metadata.name}</PoolName>
            {poolData && (
              <Box ml={['auto', 0]}>
                <PoolCapacityLabel pool={poolData} />
              </Box>
            )}
          </Shelf>
        ) : (
          <PoolName>Tinlake</PoolName>
        )}
        <PageName>
          {props.parentPage && props.parentPageHref && (
            <>
              <PoolLink href={props.parentPageHref}>{props.parentPage}</PoolLink> <Arrow>►</Arrow>{' '}
            </>
          )}
          {props.page}
        </PageName>
      </Title>
      {props.rightContent && <Box>{props.rightContent}</Box>}
    </Shelf>
  )
}

export default PageTitle

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
  margin-right: 16px;
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const PoolName = styled.h2`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
`

const PageName = styled.h1`
  font-size: 16px;
  font-weight: 600;
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
