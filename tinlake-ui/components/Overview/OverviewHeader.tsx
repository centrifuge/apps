import {
  addThousandsSeparators,
  baseToDisplay,
  feeToInterestRate,
  feeToInterestRateCompounding,
  ITinlake,
  toPrecision,
} from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { FormDown } from 'grommet-icons'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import config, { Pool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { useTrancheYield } from '../../utils/hooks'
import { useMedia } from '../../utils/useMedia'
import { usePool } from '../../utils/usePool'
import { Button } from '../Button'
import { ButtonGroup } from '../ButtonGroup'
import { Card } from '../Card'
import { Divider } from '../Divider'
import { SectionHeading } from '../Heading'
import InvestAction from '../InvestAction'
import { LabeledValue } from '../LabeledValue'
import { Box, Flex, Shelf, Stack } from '../Layout'
import { Tooltip } from '../Tooltip'
import { ValuePairList } from '../ValuePairList'

interface Props {
  tinlake: ITinlake
  selectedPool: Pool
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const dispatch = useDispatch()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const { data: poolData } = usePool(props.selectedPool.addresses.ROOT_CONTRACT)

  const { dropYield } = useTrancheYield(props.selectedPool.addresses.ROOT_CONTRACT)

  const dropRate = poolData?.senior?.interestRate || undefined

  const [awaitingConnect, setAwaitingConnect] = React.useState(false)

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
          <Tooltip id="dropApy" underline>
            DROP APY {!isMobile && '(30 days)'}
          </Tooltip>
        ) : (
          <Tooltip id="dropApr" underline>
            Fixed DROP rate {!isMobile && '(APR)'}
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
              {'addresses' in props.selectedPool &&
              config.featureFlagNewOnboardingPools.includes(props.selectedPool.addresses.ROOT_CONTRACT) ? (
                <Button label="Invest" primary onClick={invest} />
              ) : (
                <InvestAction pool={props.selectedPool} />
              )}
            </ButtonGroup>
          </Stack>
        ) : (
          <Shelf justifyContent="space-evenly">
            {poolStats.map((item, i) => (
              <>
                <Box p="small" minWidth={130}>
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
