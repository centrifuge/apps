import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import * as React from 'react'
import styled from 'styled-components'
import { Card } from '../../../components/Card'
import { SectionHeading } from '../../../components/Heading'
import { Box, Shelf, Stack } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Tooltip } from '../../../components/Tooltip'
import { ValuePairList } from '../../../components/ValuePairList'
import { Pool, UpcomingPool } from '../../../config'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
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
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined

  const { dropYield } = useTrancheYield(tinlake.contractAddresses.ROOT_CONTRACT)

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  const isMaker = !!poolData?.maker

  const availableLiquidityVal = isMaker
    ? poolData?.reserve.add(poolData?.maker?.remainingCredit || new BN(0))
    : poolData?.reserve

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
                <SectionHeading>DROP Tranche</SectionHeading>
              </Shelf>
            </Shelf>
            <Stack gap="small">
              <TrancheNote>Senior tranche &mdash; Lower risk, stable return</TrancheNote>

              <ValuePairList
                variant="tertiary"
                items={[
                  {
                    term: 'Token price',
                    value: poolData?.senior
                      ? addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))
                      : null,
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
                ]}
              />
            </Stack>
          </Card>

          <DividerInner>&nbsp;</DividerInner>

          <Box mt="xsmall" mb="xsmall" textAlign="center">
            <div>
              DROP is protected by a{' '}
              <Tooltip id="tinRiskBuffer" underline>
                <span style={{ fontWeight: 'bold' }}>
                  <LoadingValue done={!!currentJuniorRatio}>
                    {toPrecision((Math.round((currentJuniorRatio || 0) * 10000) / 100).toString(), 2)}%
                  </LoadingValue>{' '}
                  TIN buffer
                </span>
              </Tooltip>{' '}
              <Tooltip id="minimumTinRiskBuffer" underline>
                <LoadingValue done={!!minJuniorRatio}>
                  (min: {toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2)}%)
                </LoadingValue>
              </Tooltip>
            </div>
          </Box>

          <DividerInner>&nbsp;</DividerInner>

          <Card p="medium">
            <Shelf justifyContent="space-between">
              <Shelf gap="xsmall" mb="xsmall">
                <Box as={TokenLogo} src="/static/TIN_final.svg" display={['none', 'inline']} />
                <SectionHeading>TIN Tranche</SectionHeading>
              </Shelf>
            </Shelf>
            <Stack gap="small">
              <TrancheNote>Junior tranche &mdash; Higher risk, variable return</TrancheNote>

              <ValuePairList
                variant="tertiary"
                items={[
                  {
                    term: 'Token price',
                    value: poolData?.senior
                      ? addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.tokenPrice || '0', 27), 4))
                      : null,
                  },
                  {
                    term: 'Balance of Issuer',
                    value: poolData?.senior
                      ? addThousandsSeparators(
                          toPrecision(
                            baseToDisplay(
                              poolData?.juniorInvestors
                                ? Object.values(poolData.juniorInvestors).reduce(
                                    (prev: BN, inv: { collected: BN; uncollected: BN }) => {
                                      return prev.add(inv.collected).add(inv.uncollected)
                                    },
                                    new BN(0)
                                  )
                                : '0',
                              18
                            ),
                            0
                          )
                        )
                      : null,
                    valueUnit: props.selectedPool.metadata.currencySymbol || 'DAI',
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
