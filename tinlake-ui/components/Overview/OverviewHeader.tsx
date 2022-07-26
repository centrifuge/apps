import {
  addThousandsSeparators,
  baseToDisplay,
  feeToInterestRate,
  feeToInterestRateCompounding,
  toPrecision,
} from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { FormDown } from 'grommet-icons'
import * as React from 'react'
import { Pool } from '../../config'
import { useTrancheYield } from '../../utils/hooks'
import { useMedia } from '../../utils/useMedia'
import { usePool } from '../../utils/usePool'
import { ButtonGroup } from '../ButtonGroup'
import { Card } from '../Card'
import { Divider } from '../Divider'
import { SectionHeading } from '../Heading'
import { LabeledValue } from '../LabeledValue'
import { Box, Flex, Shelf, Stack } from '../Layout'
import { Tooltip } from '../Tooltip'
import { ValuePairList } from '../ValuePairList'

interface Props {
  selectedPool: Pool
  investButton: React.ReactElement
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.selectedPool.addresses.ROOT_CONTRACT)

  const { dropYield, tinYield } = useTrancheYield(props.selectedPool.addresses.ROOT_CONTRACT)

  const dropRate = poolData?.senior?.interestRate || undefined

  const isMakerIntegrated =
    props.selectedPool.addresses.CLERK !== undefined && props.selectedPool.metadata.maker?.ilk !== ''

  const [open, setOpen] = React.useState(false)

  const makerDropCollateralValue =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance.mul(poolData.senior!.tokenPrice).div(new BN(10).pow(new BN(27)))
      : undefined
  const makerDebtUtilization =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance
      ? poolData?.maker?.debt
          .mul(new BN(10).pow(new BN(45)))
          .div(poolData?.maker?.line)
          .div(new BN(10).pow(new BN(16)))
      : undefined

  const makerDropShare =
    isMakerIntegrated && poolData?.maker && poolData?.maker?.dropBalance && poolData.senior
      ? poolData?.maker?.dropBalance
          .mul(new BN(10).pow(new BN(18)))
          .div(poolData?.senior?.totalSupply)
          .div(new BN(10).pow(new BN(16)))
      : undefined

  const isMobile = useMedia({ below: 'medium' })

  const poolStats = [
    {
      term: 'Asset type',
      value: props.selectedPool.metadata.asset,
    },
    {
      term: (
        <Tooltip id="assetMaturity" underline>
          Asset maturity
        </Tooltip>
      ),
      value: props.selectedPool.metadata.assetMaturity,
    },
    {
      term:
        dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0)) ? (
          <Tooltip id="seniorApy" underline>
            Senior APY {!isMobile && '(30 days)'}
          </Tooltip>
        ) : (
          <Tooltip id="seniorApr" underline>
            Fixed senior rate {!isMobile && '(APR)'}
          </Tooltip>
        ),
      termSuffix: isMobile
        ? dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))
          ? '(30 days)'
          : '(APR)'
        : undefined,
      valueIcon: '/static/DROP_final.svg',
      value:
        dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))
          ? dropYield
          : toPrecision(feeToInterestRate(dropRate || '0'), 2),
      valueUnit: '%',
    },
    {
      term: (
        <Tooltip id="juniorApy" underline>
          Junior APY {!isMobile && '(90 days)'}
        </Tooltip>
      ),
      termSuffix: isMobile
        ? tinYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))
          ? '(90 days)'
          : ''
        : undefined,
      valueIcon: '/static/TIN_final.svg',
      value: tinYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0)) ? tinYield : 'Not yet available',
      valueUnit: tinYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0)) ? '%' : '',
    },
    {
      term: 'Pool value',
      valueIcon: isMobile ? undefined : `/static/currencies/${props.selectedPool.metadata.currencySymbol}.svg`,
      value: addThousandsSeparators(
        toPrecision(baseToDisplay((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)), 18), 0)
      ),
      valueUnit: props.selectedPool.metadata.currencySymbol,
    },
  ]

  const makerStats = [
    {
      term: 'Debt Ceiling',
      value: `${addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.line || new BN(0), 45 + 6), 1))}M`,
      valueUnit: 'DAI',
    },
    {
      term: 'Current Debt',
      value: `${addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maker?.debt || new BN(0), 18 + 6), 1))}M`,
      valueUnit: 'DAI',
    },
    {
      term: 'Stability Fee (APY)',
      value: toPrecision(feeToInterestRateCompounding(poolData?.maker?.duty || '0'), 2),
      valueUnit: '%',
    },
  ]

  return (
    <Stack gap="small">
      <Card p="medium" position="relative" zIndex={1}>
        {isMobile ? (
          <Stack gap="medium">
            <ValuePairList items={poolStats} />
            <ButtonGroup>
              <Box display={{ small: 'none' }}>{props.investButton}</Box>
            </ButtonGroup>
          </Stack>
        ) : (
          <Shelf justifyContent="space-evenly">
            {poolStats.map((item, i) => (
              <>
                <Box p="small" minWidth={160}>
                  <LabeledValue
                    value={item.value}
                    icon={item.valueIcon}
                    unit={item.valueUnit}
                    label={item.term}
                    variant="primaryList"
                  />
                </Box>
                {i < poolStats.length - 1 && <Box width="1px" alignSelf="stretch" borderLeft="1px solid #eee" />}
              </>
            ))}
          </Shelf>
        )}
      </Card>

      {isMakerIntegrated && (
        <>
          <Card interactive>
            <Shelf
              p="medium"
              justifyContent="space-between"
              onClick={() => setOpen(!open)}
              style={{ cursor: 'pointer' }}
            >
              <Shelf gap="small" alignSelf="baseline" alignItems="baseline">
                <Box
                  as="img"
                  src="/static/maker-logo.svg"
                  width="24px"
                  height="24px"
                  alignSelf="flex-start"
                  mt="-2px"
                />
                <Stack gap="4px">
                  <SectionHeading>Maker Integrated</SectionHeading>
                  {!isMobile && <span>This pool is directly integrated with a Maker vault for liquidity</span>}
                </Stack>
              </Shelf>
              <Shelf gap="small" flex={{ medium: '0 0 45%' }}>
                {!isMobile && (
                  <Shelf justifyContent="space-between" alignSelf="baseline" alignItems="baseline" flexGrow={1}>
                    {makerStats.map((item) => (
                      // eslint-disable-next-line react/jsx-key
                      <LabeledValue value={item.value} unit={item.valueUnit} label={item.term} variant="primaryList" />
                    ))}
                  </Shelf>
                )}
                <Flex alignSelf={{ medium: 'flex-start' }} my={['-20px', '-20px', '-2px']} ml="auto">
                  <FormDown style={{ transform: open ? 'rotate(-180deg)' : '' }} />
                </Flex>
              </Shelf>
            </Shelf>
            {open && (
              <>
                <Divider />
                <Stack p="medium" gap="medium">
                  {isMobile && (
                    <>
                      <ValuePairList items={makerStats} />
                      <Divider />
                    </>
                  )}
                  <Stack
                    gap={['medium', 'medium', 72]}
                    flexDirection={['column', 'column', 'row']}
                    alignItems="stretch"
                  >
                    <Box pl={{ medium: 40 }}>
                      For this pool Maker provides a revolving line of credit against real-world assets as collateral.
                      The direct integration allows the Asset Originator to lock up DROP as collateral in a Maker vault,
                      draw DAI in return and use it to finance new originations. The credit line is capped at the debt
                      ceiling set by Maker governance. This provides instant liquidity for the Asset Originator.
                    </Box>

                    <Box flex={{ medium: '0 0 45%' }} pr={{ medium: 40 }}>
                      <ValuePairList
                        variant="secondary"
                        items={[
                          {
                            term: 'Collateral Balance',
                            value: addThousandsSeparators(
                              toPrecision(baseToDisplay(poolData?.maker?.dropBalance || new BN(0), 18), 0)
                            ),
                            valueUnit: 'DROP',
                          },
                          {
                            term: 'Collateral Value',
                            value: addThousandsSeparators(
                              toPrecision(baseToDisplay(makerDropCollateralValue || new BN(0), 18), 0)
                            ),
                            valueUnit: 'DAI',
                          },
                          {
                            term: 'Debt Utilization',
                            value: parseFloat((makerDebtUtilization || new BN(0)).toString()),
                            valueUnit: '%',
                          },
                          {
                            term: 'Maker DROP Share',
                            value: parseFloat((makerDropShare || new BN(0)).toString()),
                            valueUnit: '%',
                          },
                        ]}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </>
            )}
          </Card>
        </>
      )}
    </Stack>
  )
}

export default OverviewHeader
