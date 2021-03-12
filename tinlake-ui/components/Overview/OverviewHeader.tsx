import { addThousandsSeparators, baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import config, { Pool } from '../../config'
import { PoolData, PoolState } from '../../ducks/pool'
import { useOnConnect } from '../../utils/hooks'
import InvestAction from '../InvestAction'
import { Tooltip } from '../Tooltip'

interface Props {
  tinlake: ITinlake
  selectedPool: Pool
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const onConnect = useOnConnect(props.tinlake)

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dropRate = poolData?.senior?.interestRate || undefined

  const invest = () => {
    if (address) {
      if (poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) {
        router.push(
          `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/investments`
        )
      } else {
        router.push(
          `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/onboarding`
        )
      }
    } else {
      onConnect(async (addr: string) => {
        console.log(3)
        const inAMemberlist = (await props.tinlake.checkSeniorTokenMemberlist(addr))
          ? true
          : await props.tinlake.checkJuniorTokenMemberlist(addr)

        if (inAMemberlist) {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/investments`
          )
        } else {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/onboarding`
          )
        }
      })
    }
  }

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
      <HeaderBox width="400px">
        <Heading level="5">{props.selectedPool.metadata.asset}</Heading>
        <Type>Asset type</Type>
      </HeaderBox>
      <Tooltip id="assetMaturity">
        <HeaderBox>
          <Heading level="4">{props.selectedPool.metadata.assetMaturity}</Heading>
          <Type>Asset maturity</Type>
        </HeaderBox>
      </Tooltip>
      <Tooltip id="dropAPR">
        <HeaderBox>
          <Heading level="4">
            <TokenLogo src={`/static/DROP_final.svg`} />
            {toPrecision(feeToInterestRate(dropRate || '0'), 2)}
            <Unit>%</Unit>
          </Heading>
          <Type>DROP APR</Type>
        </HeaderBox>
      </Tooltip>
      <Tooltip id="poolValue">
        <HeaderBox style={{ borderRight: 'none' }}>
          <Heading level="4">
            <TokenLogo src={`/static/DAI.svg`} />
            {addThousandsSeparators(
              toPrecision(
                baseToDisplay((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)), 18),
                0
              )
            )}
            <Unit>DAI</Unit>
          </Heading>
          <Type>Pool Value</Type>
        </HeaderBox>
      </Tooltip>
      <HeaderBox style={{ borderRight: 'none' }}>
        {'addresses' in props.selectedPool &&
        config.featureFlagNewOnboardingPools.includes(props.selectedPool.addresses.ROOT_CONTRACT) ? (
          <Anchor>
            <Button label="Invest" primary onClick={invest} />
          </Anchor>
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
  width: ${(props) => props.width || '200px'};
  flex-direction: column;
  justify-content: center;
  padding: 10px 20px 10px 0;
  height: 80px;

  h3,
  h4,
  h5,
  h6 {
    margin: 0 4px 4px 4px;
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
  width: 20px;
  height: 20px;
  position: relative;
  top: -2px;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  margin-left: 4px;
  color: #333;
`
