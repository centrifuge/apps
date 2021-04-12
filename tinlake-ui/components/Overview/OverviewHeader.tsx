import { addThousandsSeparators, baseToDisplay, feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import config, { Pool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { PoolData, PoolState } from '../../ducks/pool'
import InvestAction from '../InvestAction'
import { Tooltip } from '../Tooltip'

interface Props {
  tinlake: ITinlake
  selectedPool: Pool
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dropRate = poolData?.senior?.interestRate || undefined

  const [awaitingConnect, setAwaitingConnect] = React.useState(false)

  const isMakerIntegrated = props.selectedPool.addresses.CLERK !== undefined

  React.useEffect(() => {
    if (address && awaitingConnect) {
      ;(async () => {
        const inAMemberlist = (await props.tinlake.checkSeniorTokenMemberlist(address))
          ? true
          : await props.tinlake.checkJuniorTokenMemberlist(address)

        if (inAMemberlist) {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/investments`
          )
        } else {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/onboarding`
          )
        }
      })()

      setAwaitingConnect(false)
    }
  }, [address, props.tinlake])

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
      setAwaitingConnect(true)
      dispatch(ensureAuthed())
    }
  }

  return (
    <Box margin={{ bottom: 'large' }}>
      <Box
        elevation="small"
        round="xsmall"
        background="white"
        direction="row"
        justify="between"
        gap="medium"
        pad="medium"
        style={{ zIndex: 3 }}
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
              <TokenLogo src={`/static/currencies/${props.selectedPool.metadata.currencySymbol}.svg`} />
              {addThousandsSeparators(
                toPrecision(
                  baseToDisplay((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)), 18),
                  0
                )
              )}
              <Unit>{props.selectedPool.metadata.currencySymbol}</Unit>
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
      {isMakerIntegrated && (
        <MakerBox direction="row" round="xsmall" gap="small" elevation="small" background="#1AAB9B">
          <MakerLogo>
            <img src="/static/maker-logo.svg" />
          </MakerLogo>
          <Box pad={{ top: '8px;' }} direction="row">
            This pool is directly integrated with Maker for liquidity. &nbsp;<a href="#">Learn more</a>
          </Box>
          {/* <MakerMetric style={{ borderRight: '1px solid #fff' }}>
            <h3>Remaining credit</h3>
            <h2>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.remainingCredit || new BN(0), 18), 0))}{' '}
              <MakerUnit>DAI</MakerUnit>{' '}
            </h2>
          </MakerMetric> */}
          <MakerMetric margin={{ left: 'auto' }} style={{ borderRight: '1px solid #fff' }}>
            <h3>Current Debt</h3>
            <h2>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.art || new BN(0), 18), 0))}{' '}
              <MakerUnit>DAI</MakerUnit>{' '}
            </h2>
          </MakerMetric>
          <MakerMetric style={{ borderRight: '1px solid #fff' }}>
            <h3>Debt Ceiling</h3>
            <h2>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.line || new BN(0), 45 + 6), 0))}M{' '}
              <MakerUnit>DAI</MakerUnit>
            </h2>
          </MakerMetric>
          <MakerMetric>
            <h3>Stability Fee</h3>
            <h2>
              {toPrecision(feeToInterestRate(poolData?.maker?.duty || '0'), 2)} <MakerUnit>%</MakerUnit>
            </h2>
          </MakerMetric>
        </MakerBox>
      )}
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
const MakerBox = styled(Box)`
  color: #fff;
  position: relative;
  top: -10px;
  padding: 22px 24px 10px 24px;

  a {
    color: #fff;
  }
`

const MakerLogo = styled.div`
  margin-top: 4px;

  img {
    width: 28px;
    height: 28px;
  }
`

const MakerMetric = styled(Box)`
  padding: 0 24px 0 10px;
  h3 {
    margin: 0;
    font-size: 12px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }

  &:last-child {
    padding-right: 0;
  }
`

const MakerUnit = styled.div`
  display: inline-block;
  font-size: 13px;
  font-weight: normal;
`
