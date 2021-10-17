import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { FormDown } from 'grommet-icons'
import * as React from 'react'
import styled from 'styled-components'
import { Card } from '../../../components/Card'
import { SectionHeading } from '../../../components/Heading'
import { Box, Shelf, Stack } from '../../../components/Layout'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Tooltip } from '../../../components/Tooltip'
import { Value } from '../../../components/Value'
import { ValuePairList } from '../../../components/ValuePairList'
import { Pool, UpcomingPool } from '../../../config'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
import { Fixed27Base } from '../../../utils/ratios'
import { toPrecision } from '../../../utils/toPrecision'
import { useAssets } from '../../../utils/useAssets'
import { usePool } from '../../../utils/usePool'
import { DividerInner, FlexWrapper, TokenLogo } from './styles'

interface Props {
  selectedPool: Pool | UpcomingPool
}

const SecondsInDay = 60 * 60 * 24

const e18 = new BN(10).pow(new BN(18))

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

const InvestmentOverview: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)
  const { data: assets } = useAssets(tinlake.contractAddresses.ROOT_CONTRACT!)

  const dropTotalValue = poolData?.senior ? poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice) : undefined
  const tinTotalValue = poolData ? poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice) : undefined

  const ongoingAssets = assets ? assets.filter((asset) => asset.status && asset.status === 'ongoing') : undefined

  const avgInterestRate = ongoingAssets
    ? ongoingAssets
        .filter((asset) => asset.interestRate)
        .reduce((sum: BN, asset) => {
          return sum.add(new BN(asset.interestRate!))
        }, new BN(0))
        .divn(ongoingAssets.length)
    : undefined
  const avgMaturity = ongoingAssets
    ? ongoingAssets
        .filter((asset) => asset.maturityDate && asset.financingDate)
        .reduce((sum: number, asset) => {
          return sum + (asset.maturityDate! - asset.financingDate!) / SecondsInDay
        }, 0) / ongoingAssets.length
    : undefined

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined

  const { dropYield, tinYield } = useTrancheYield(tinlake.contractAddresses.ROOT_CONTRACT)

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  const juniorHeldByIssuer =
    poolData && poolData?.juniorInvestors && tinTotalValue
      ? Object.values(poolData.juniorInvestors)
          .reduce((prev: BN, inv: { collected: BN; uncollected: BN }) => {
            return prev.add(inv.collected || new BN(0)).add(inv.uncollected || new BN(0))
          }, new BN(0))
          .mul(e18)
          .div(tinTotalValue.div(new BN('10').pow(new BN('27'))))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  const isMaker = !!poolData?.maker

  const availableLiquidityVal = isMaker
    ? poolData?.reserve.add(poolData?.maker?.remainingCredit || new BN(0))
    : poolData?.reserve

  const [tinDetailsOpen, setTinDetailsOpen] = React.useState(false)

  return (
    <>
      <FlexWrapper>
        <Card p="medium" flex="1 1 35%" mr={['0', '0', 'medium']}>
          <Shelf mb="small" justifyContent="space-between">
            <SectionHeading>Assets</SectionHeading>
          </Shelf>
          <Box mb="xlarge">
            <ValuePairList
              variant="secondary"
              items={[
                {
                  term: (
                    <Tooltip id="assetValue" underline>
                      Asset value
                    </Tooltip>
                  ),
                  value: poolData?.netAssetValue
                    ? addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || '0', 18), 0))
                    : null,
                  valueUnit: props.selectedPool.metadata.currencySymbol || 'DAI',
                },
                {
                  term: 'Number of assets',
                  value: ongoingAssets?.length ?? null,
                },

                {
                  term: 'Average financing fee',
                  value: avgInterestRate ? toPrecision(feeToInterestRate(avgInterestRate), 2) : null,
                  valueUnit: '%',
                },
                {
                  term: 'Average maturity',
                  value:
                    avgMaturity == null
                      ? null
                      : avgMaturity > 90
                      ? `${Math.round(((avgMaturity || 0) / (365 / 12)) * 10) / 10} months`
                      : `${Math.round((avgMaturity || 0) * 10) / 10} days`,
                },
              ]}
            />
          </Box>

          <Shelf mb="small" justifyContent="space-between">
            <SectionHeading>Reserve</SectionHeading>
          </Shelf>

          <ValuePairList
            variant="secondary"
            items={[
              {
                term: (
                  <Tooltip id={isMaker ? 'availableLiquidityMaker' : 'availableLiquidity'} underline>
                    Available liquidity
                  </Tooltip>
                ),
                value: availableLiquidityVal
                  ? addThousandsSeparators(toPrecision(baseToDisplay(availableLiquidityVal || '0', 18), 0))
                  : null,
                valueUnit: props.selectedPool.metadata.currencySymbol || 'DAI',
              },
              {
                term: (
                  <Tooltip id="cashDrag" underline>
                    Cash drag
                  </Tooltip>
                ),
                value: reserveRatio ? parseFloat(reserveRatio.toString()) / 100 : null,
                valueUnit: '%',
              },
            ]}
          />
        </Card>
        <Stack flex="1 1 35%" justifyContent="space-between">
          <Card p="medium">
            <Shelf justifyContent="space-between">
              <Shelf gap="xsmall" mb="xsmall">
                <Box as={TokenLogo} src="/static/DROP_final.svg" display={['none', 'inline']} />
                <SectionHeading>Senior tranche</SectionHeading>
              </Shelf>
              <Value
                variant="sectionHeading"
                value={
                  dropTotalValue ? addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 0)) : null
                }
                unit={props.selectedPool.metadata.currencySymbol || 'DAI'}
              />
            </Shelf>
            <Stack gap="small">
              <TrancheNote>DROP token &mdash; Lower risk, stable return</TrancheNote>

              <ValuePairList
                variant="tertiary"
                items={[
                  {
                    term: 'Token price',
                    value: poolData?.senior
                      ? addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))
                      : null,
                    valueUnit: props.selectedPool.metadata.currencySymbol || 'DAI',
                  },
                  dropYield && !(poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                    ? {
                        term: 'DROP yield (30d APY)',
                        value: dropYield,
                        valueUnit: '%',
                      }
                    : {
                        term: 'Fixed DROP rate (APR)',
                        value:
                          poolData?.senior?.interestRate &&
                          toPrecision(feeToInterestRate(poolData?.senior?.interestRate || '0'), 2),
                        valueUnit: '%',
                      },
                  {
                    term: 'Minimum risk buffer',
                    value: toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2),
                    valueUnit: '%',
                  },
                ]}
              />
            </Stack>
          </Card>

          <DividerInner>&nbsp;</DividerInner>

          {/* <Box mt="xsmall" mb="xsmall" textAlign="center">
            <div>
              Senior is protected by a{' '}
              <Tooltip id="tinRiskBuffer" underline>
                <span style={{ fontWeight: 'bold' }}>
                  <LoadingValue done={!!currentJuniorRatio}>
                    {toPrecision((Math.round((currentJuniorRatio || 0) * 10000) / 100).toString(), 2)}%
                  </LoadingValue>{' '}
                  risk buffer
                </span>
              </Tooltip>{' '}
              <Tooltip id="minimumTinRiskBuffer" underline>
                <LoadingValue done={!!minJuniorRatio}>
                  ({toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2)}% minimum)
                </LoadingValue>
              </Tooltip>
            </div>
          </Box>

          <DividerInner>&nbsp;</DividerInner> */}

          <Card p="medium">
            <Shelf justifyContent="space-between">
              <Shelf gap="xsmall" mb="xsmall">
                <Box as={TokenLogo} src="/static/TIN_final.svg" display={['none', 'inline']} />
                <SectionHeading>Junior tranche</SectionHeading>
              </Shelf>
              <Shelf
                justifyContent="space-between"
                style={{ marginLeft: 'auto', cursor: 'pointer' }}
                onClick={() => {
                  setTinDetailsOpen(!tinDetailsOpen)
                }}
              >
                <Value
                  variant="sectionHeading"
                  value={
                    tinTotalValue ? addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 0)) : null
                  }
                  unit={props.selectedPool.metadata.currencySymbol || 'DAI'}
                />
                <Caret style={{ position: 'relative', top: '0' }}>
                  <FormDown style={{ transform: tinDetailsOpen ? 'rotate(-180deg)' : '' }} />
                </Caret>
              </Shelf>
            </Shelf>
            <Stack gap="small">
              <TrancheNote>TIN token &mdash; Higher risk, variable return</TrancheNote>

              {tinDetailsOpen && (
                <ValuePairList
                  variant="tertiary"
                  items={[
                    {
                      term: 'Total risk buffer',
                      value: toPrecision(
                        (
                          Math.round(
                            parseRatio(
                              !(poolData?.netAssetValue && poolData?.reserve) ||
                                (poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                                ? new BN(0)
                                : (poolData?.junior.totalSupply || new BN(0))
                                    .mul(poolData?.junior.tokenPrice || new BN(0))
                                    .div((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)))
                            ) * 10000
                          ) / 100
                        ).toString(),
                        2
                      ),
                      valueUnit: '%',
                    },
                    {
                      term: 'Locked minimum risk buffer',
                      value: toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2),
                      valueUnit: '%',
                    },
                    {
                      term: 'Locked Maker vault protection',
                      value: toPrecision(
                        (
                          Math.round(
                            parseRatio(
                              poolData?.maker?.creditline && poolData?.netAssetValue.add(poolData?.reserve).gtn(0)
                                ? (
                                    poolData?.maker?.creditline.mul(poolData?.maker?.mat.sub(Fixed27Base)) || new BN(0)
                                  ).div(poolData?.netAssetValue.add(poolData?.reserve) || new BN(0))
                                : new BN(0)
                            ) * 10000
                          ) / 100
                        ).toString(),
                        2
                      ),
                      valueUnit: '%',
                    },
                    {
                      term: 'Excess risk buffer',
                      value: toPrecision(
                        !(poolData?.netAssetValue && poolData?.reserve) ||
                          (poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                          ? '0'
                          : (
                              Math.round(
                                (parseRatio(
                                  (poolData?.junior.totalSupply.mul(poolData?.junior.tokenPrice) || new BN(0)).div(
                                    poolData?.netAssetValue.add(poolData?.reserve) || new BN(0)
                                  )
                                ) -
                                  (minJuniorRatio || 0) -
                                  parseRatio(
                                    (
                                      (poolData?.maker?.creditline || new BN(0)).mul(
                                        (poolData?.maker?.mat || Fixed27Base).sub(Fixed27Base)
                                      ) || new BN(0)
                                    ).div(poolData?.netAssetValue.add(poolData?.reserve) || new BN(0))
                                  )) *
                                  10000
                              ) / 100
                            ).toString(),
                        2
                      ),
                      valueUnit: '%',
                    },
                  ]}
                />
              )}
              <ValuePairList
                variant="tertiary"
                items={[
                  {
                    term: 'Token price',
                    value: poolData?.senior
                      ? addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.tokenPrice || '0', 27), 4))
                      : null,
                    valueUnit: props.selectedPool.metadata.currencySymbol || 'DAI',
                  },
                  tinYield && !(poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())
                    ? {
                        term: 'TIN yield (90d APY)',
                        value: tinYield,
                        valueUnit: '%',
                      }
                    : undefined,
                  {
                    term: 'TIN share provided by Issuer',
                    value: reserveRatio ? parseFloat(juniorHeldByIssuer.toString()) / 100 : null,
                    valueUnit: '%',
                  },
                ]}
              />
            </Stack>
          </Card>
        </Stack>
      </FlexWrapper>
    </>
  )
}

export default InvestmentOverview

const TrancheNote = styled.div`
  color: #777;
`

const Caret = styled.div`
  position: relative;
  display: inline-block;
  top: 6px;
  height: 24px;
  margin-left: 10px;
  svg {
    transition: 200ms;
  }
`
