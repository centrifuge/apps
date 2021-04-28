import {
  addThousandsSeparators,
  baseToDisplay,
  feeToInterestRate,
  feeToInterestRateCompounding,
  ITinlake,
  toPrecision,
} from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import { FormDown } from 'grommet-icons'
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

  const [open, setOpen] = React.useState(false)

  const makerDropCollateralValue =
    poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance.mul(poolData.senior!.tokenPrice).div(new BN(10).pow(new BN(27)))
      : undefined
  const makerDebtUtilization =
    poolData?.maker && poolData?.maker?.dropBalance
      ? poolData?.maker?.debt
          .mul(new BN(10).pow(new BN(45)))
          .div(poolData?.maker?.line)
          .div(new BN(10).pow(new BN(14)))
      : undefined

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
        <MakerBox round="xsmall" gap="small" elevation="small" background="#1AAB9B">
          <Box direction="row">
            <Box basis="2/3" direction="row">
              <MakerLogo>
                <img src="/static/maker-logo.svg" />
              </MakerLogo>
              <Box pad={{ top: '8px;' }} style={{ fontWeight: 'bold' }} direction="row">
                This pool is directly integrated with a Maker vault for liquidity. &nbsp;
                <Details onClick={() => setOpen(!open)} direction="row">
                  <h2>Show details</h2>
                  <Caret>
                    <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
                  </Caret>
                </Details>
              </Box>
            </Box>
            <Box basis="1/3" direction="row">
              <MakerMetric style={{ borderRight: '1px solid #fff' }}>
                <h3>Current Debt</h3>
                <h2>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18), 0))}{' '}
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
                <h3>Stability Fee (APY)</h3>
                <h2>
                  {toPrecision(feeToInterestRateCompounding(poolData?.maker?.duty || '0'), 2)} <MakerUnit>%</MakerUnit>
                </h2>
              </MakerMetric>
            </Box>
          </Box>
          {open && (
            <Box direction="row" margin={{ bottom: 'small' }}>
              <Box basis="2/3" direction="row">
                <div style={{ width: '75%', lineHeight: '1.8em' }}>
                  For this pool Maker provides a revolving line of credit against real-world assets as collateral. The
                  direct integration allows the Asset Originator to lock up DROP as collateral in a Maker vault, draw
                  DAI in return and use it to finance new originations. The credit line is capped at the debt ceiling
                  set by Maker governance. This provides instant liquidity for the Asset Originator. &nbsp; &nbsp;
                  <a
                    href="https://medium.com/centrifuge/defi-2-0-first-real-world-loan-is-financed-on-maker-fbe24675428f"
                    target="_blank"
                  >
                    Read more
                  </a>
                </div>
                <Box></Box>
              </Box>
              <Box basis="1/3" margin={{ top: 'xsmall' }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        scope="row"
                        pad={{ top: '0', bottom: '12px' }}
                        border={{ side: 'bottom', color: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        Collateral Balance
                      </TableCell>
                      <TableCell
                        style={{ textAlign: 'end' }}
                        border={{ side: 'bottom', color: 'rgba(255, 255, 255, 0.3)' }}
                        pad={{ top: '0', bottom: '12px' }}
                      >
                        {addThousandsSeparators(
                          toPrecision(baseToDisplay(poolData?.maker?.dropBalance || new BN(0), 18), 0)
                        )}{' '}
                        DROP
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        scope="row"
                        border={{ side: 'bottom', color: 'rgba(255, 255, 255, 0.3)' }}
                        pad={{ vertical: '12px' }}
                      >
                        Collateral Value
                      </TableCell>
                      <TableCell
                        style={{ textAlign: 'end' }}
                        border={{ side: 'bottom', color: 'rgba(255, 255, 255, 0.3)' }}
                        pad={{ vertical: '12px' }}
                      >
                        {addThousandsSeparators(
                          toPrecision(baseToDisplay(makerDropCollateralValue || new BN(0), 18), 0)
                        )}{' '}
                        DAI
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell scope="row" border={{ color: 'transparent' }} pad={{ vertical: '12px' }}>
                        Debt Utilization
                      </TableCell>
                      <TableCell
                        style={{ textAlign: 'end' }}
                        border={{ color: 'transparent' }}
                        pad={{ vertical: '12px' }}
                      >
                        {parseFloat((makerDebtUtilization || new BN(0)).toString()) / 100} %
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
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
  width: 40px;

  img {
    width: 28px;
    height: 28px;
  }
`

const MakerMetric = styled(Box)`
  padding: 0 32px 0 18px;
  h3 {
    margin: 0;
    font-size: 12px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }

  &:first-child {
    padding-left: 0;
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

const Details = styled(Box)`
  h2 {
    margin: 0 0 0 10px;
    font-size: 14px;
    font-weight: normal;
    text-decoration: underline;
  }
`

const Caret = styled.div`
  position: relative;
  display: inline;
  height: 16px;
  margin-left: 10px;

  svg {
    transition: 200ms;
    stroke: #fff;
    transform-style: preserve-3d;
    width: 20px;
    height: 20px;
  }
`
