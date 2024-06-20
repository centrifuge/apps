import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { NetworkIcon } from '@centrifuge/centrifuge-react'
import { Box, Card, Grid, IconExternalLink, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { evmChains } from '../../config'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { usePool } from '../../utils/usePools'
import { Spinner } from '../Spinner'

type Props = {
  assetType?: { class: string; subClass: string }
  averageMaturity: string
  loans: TinlakeLoan[] | Loan[] | null | undefined
  poolId: string
}

export const KeyMetrics = ({ assetType, averageMaturity, loans, poolId }: Props) => {
  const isTinlakePool = poolId.startsWith('0x')
  const ongoingAssetCount =
    loans && [...loans].filter((loan) => loan.status === 'Active' && !loan.outstandingDebt.isZero()).length

  const writtenOffAssetCount =
    loans && [...loans].filter((loan) => loan.status === 'Active' && (loan as ActiveLoan).writeOffStatus).length

  const overdueAssetCount =
    loans &&
    [...loans].filter((loan) => {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      return (
        loan.status === 'Active' &&
        loan.pricing.maturityDate &&
        new Date(loan.pricing.maturityDate).getTime() < Date.now() &&
        !loan.outstandingDebt.isZero()
      )
    }).length

  const isBT3BT4 =
    poolId.toLowerCase() === '0x90040f96ab8f291b6d43a8972806e977631affde' ||
    poolId.toLowerCase() === '0x55d86d51ac3bcab7ab7d2124931fba106c8b60c7'

  const metrics = [
    {
      metric: 'Asset class',
      value: `${capitalize(startCase(assetType?.class))} - ${assetType?.subClass}`,
    },
    ...(isBT3BT4
      ? []
      : [
          {
            metric: 'Average asset maturity',
            value: averageMaturity,
          },
        ]),
    {
      metric: 'Total assets',
      value: loans?.length || 0,
    },
    {
      metric: 'Ongoing assets',
      value: ongoingAssetCount,
    },
    ...(writtenOffAssetCount
      ? [
          {
            metric: 'Written off assets',
            value: writtenOffAssetCount,
          },
        ]
      : []),
    ...(overdueAssetCount
      ? [
          {
            metric: 'Overdue assets',
            value: overdueAssetCount,
          },
        ]
      : []),

    ...(!isTinlakePool
      ? [
          {
            metric: 'Available networks',
            value: <AvailableNetworks poolId={poolId} />,
          },
        ]
      : []),
  ]

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Key metrics
        </Text>
        <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
          {metrics.map(({ metric, value }, index) => (
            <Grid
              borderBottomStyle={index === metrics.length - 1 ? 'none' : 'solid'}
              borderBottomWidth={index === metrics.length - 1 ? '0' : '1px'}
              borderBottomColor={index === metrics.length - 1 ? 'none' : 'borderPrimary'}
              height={32}
              key={index}
              px={1}
              gridTemplateColumns="1fr 1fr"
              width="100%"
              alignItems="center"
              gap={2}
            >
              <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
                {metric}
              </Text>
              <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
                {value}
              </Text>
            </Grid>
          ))}
        </Box>
      </Stack>
    </Card>
  )
}

const AvailableNetworks = ({ poolId }: { poolId: string }) => {
  const activeDomains = useActiveDomains(poolId)
  const pool = usePool(poolId)
  return (
    <Shelf gap={1}>
      {activeDomains.data?.length || import.meta.env.REACT_APP_COLLATOR_WSS_URL.includes('development') ? (
        <Tooltip
          bodyWidth="maxContent"
          bodyPadding={0}
          delay={300}
          body={
            <Stack p={1} gap={1} backgroundColor="backgroundSecondary">
              <Text variant="heading4">Centrifuge</Text>
              {pool.tranches.length > 1 ? (
                pool.tranches.map((tranche) => (
                  <a target="_blank" rel="noopener noreferrer" href={`${import.meta.env.REACT_APP_SUBSCAN_URL}`}>
                    <Shelf gap={1} alignItems="center">
                      <Text variant="body2" color="black">
                        View {tranche.currency.name.split(' ').at(-1)}
                      </Text>{' '}
                      <IconExternalLink color="black" size="iconSmall" />
                    </Shelf>
                  </a>
                ))
              ) : (
                <a target="_blank" rel="noopener noreferrer" href={`${import.meta.env.REACT_APP_SUBSCAN_URL}`}>
                  <Shelf gap={1} alignItems="center">
                    <Text variant="body2" color="black">
                      View transactions
                    </Text>{' '}
                    <IconExternalLink color="black" size="iconSmall" />
                  </Shelf>
                </a>
              )}
            </Stack>
          }
        >
          <NetworkIcon size="iconSmall" network={'centrifuge'} />
        </Tooltip>
      ) : (
        <Spinner size="iconSmall" />
      )}
      {activeDomains.data?.length &&
        activeDomains.data
          .filter((domain) => domain.isActive)
          .map((domain) => {
            const chain = (evmChains as any)[domain.chainId]
            return (
              <Tooltip
                delay={300}
                bodyWidth="maxContent"
                bodyPadding={0}
                body={
                  <Stack p={1} gap={1} backgroundColor="backgroundSecondary">
                    <Text variant="heading4">{chain.name}</Text>
                    {pool.tranches.length > 1 ? (
                      pool.tranches.map((tranche) => (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`${chain.blockExplorerUrl}token/${domain.trancheTokens[tranche.id]}`}
                        >
                          <Shelf gap={1} alignItems="center">
                            <Text variant="body2" color="black">
                              View {tranche.currency.name.split(' ').at(-1)}
                            </Text>{' '}
                            <IconExternalLink color="black" size="iconSmall" />
                          </Shelf>
                        </a>
                      ))
                    ) : (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${chain.blockExplorerUrl}token/${domain.trancheTokens[pool.tranches[0].id]}`}
                      >
                        <Shelf gap={1} alignItems="center">
                          <Text variant="body2" color="black">
                            View transactions
                          </Text>{' '}
                          <IconExternalLink color="black" size="iconSmall" />
                        </Shelf>
                      </a>
                    )}
                  </Stack>
                }
              >
                <NetworkIcon size="iconSmall" network={domain.chainId} />
              </Tooltip>
            )
          })}
    </Shelf>
  )
}
