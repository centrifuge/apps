import { feeToInterestRate, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import config, { Pool, UpcomingPool } from '../../config'
import { PoolData, PoolState } from '../../ducks/pool'
import InvestAction from '../InvestAction'
import { PoolLink } from '../PoolLink'

interface Props {
  selectedPool: Pool | UpcomingPool
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dropRate = poolData?.senior?.interestRate || undefined
  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined

  return (
    <Box
      direction="row"
      justify="between"
      gap="medium"
      elevation="small"
      round="xsmall"
      pad="medium"
      background="white"
      margin={{ bottom: 'large' }}
    >
      <HeaderBox pad={{ top: '4px' }} width="260px">
        <Heading level="5">{props.selectedPool.metadata.asset}</Heading>
        <Type>Asset type</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }}>
        <Heading level="4">
          <TokenLogo src={`/static/DAI.svg`} />
          5.000
        </Heading>
        <Type>Minimum investment</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }}>
        <Heading level="4">
          <TokenLogo src={`/static/DROP_final.svg`} />
          {toPrecision(feeToInterestRate(dropRate || '0'), 2)} %
        </Heading>
        <Type>DROP APR</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }}>
        <Heading level="4">{minJuniorRatio && Math.round(minJuniorRatio * 10000) / 100} %</Heading>
        <Type>Risk Protection</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }} style={{ borderRight: 'none' }}>
        <Heading level="4">60-90 days</Heading>
        <Type>Average Maturity</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '20px', left: 'small' }} style={{ borderRight: 'none' }}>
        {'addresses' in props.selectedPool &&
        config.featureFlagNewOnboardingPools.includes(props.selectedPool.addresses.ROOT_CONTRACT) ? (
          <>
            {(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
              <PoolLink href={'/investments'}>
                <Anchor>
                  <Button label="Invest" primary />
                </Anchor>
              </PoolLink>
            )}
            {!(poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) && (
              <PoolLink href={'/onboarding'}>
                <Anchor>
                  <Button label="Invest" primary />
                </Anchor>
              </PoolLink>
            )}
          </>
        ) : (
          <InvestAction pool={props.selectedPool} />
        )}
      </HeaderBox>
    </Box>
  )
}

export default OverviewHeader

const HeaderBox = styled(Box)<{ width?: string }>`
  text-align: center;
  border-right: 1px solid #dadada;
  padding-right: 20px;
  width: ${(props) => props.width || '200px'};

  h3,
  h4,
  h5,
  h6 {
    margin: 4px;
  }
`

const Type = styled.div`
  font-weight: 500;
  font-size: 13px;
  line-height: 14px;
  color: #979797;
`

const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 24px;
  height: 24px;
  position: relative;
  top: -2px;
`

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}
