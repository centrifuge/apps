import { CurrencyBalance, DailyTrancheState, Price } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalanceAbbreviated } from '@centrifuge/centrifuge-react'
import { Box, Card, IconArrowRightWhite, IconMoody, IconSp, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { evmChains } from '../../config'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { useAverageMaturity } from '../../utils/useAverageMaturity'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { useDailyTranchesStates, usePool, usePoolFees, usePoolMetadata } from '../../utils/usePools'
import { PoolStatus } from '../PoolCard/PoolStatus'
import { getPoolStatus } from '../PoolList'
import { Spinner } from '../Spinner'
import { Tooltips } from '../Tooltips'

type Props = {
  poolId: string
}

type PartialDailyTrancheState = Pick<DailyTrancheState, 'yield30DaysAnnualized'> & {
  tokenPrice: Price
  timestamp: string
}

type DailyTrancheStateArr = Record<string, PartialDailyTrancheState[]>

type Tranche = Pick<DailyTrancheState, 'id'> & {
  currency: {
    name: string
  }
}

const getTodayValue = (data: DailyTrancheStateArr | null | undefined): DailyTrancheStateArr | undefined => {
  if (!data) return
  if (!Object.keys(data).length) return

  const today = new Date()

  const filteredData: DailyTrancheStateArr = Object.keys(data).reduce((result, key) => {
    const filteredValues = data[key].filter((obj) => {
      const objDate = new Date(obj.timestamp)
      return (
        objDate.getDate() === today.getDate() &&
        objDate.getMonth() === today.getMonth() &&
        objDate.getFullYear() === today.getFullYear()
      )
    })

    if (filteredValues.length > 0) {
      result[key] = filteredValues
    }

    return result
  }, {} as DailyTrancheStateArr)

  return filteredData
}

export const KeyMetrics = ({ poolId }: Props) => {
  const isTinlakePool = poolId.startsWith('0x')
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const poolFees = usePoolFees(poolId)
  const tranchesIds = pool.tranches.map((tranche) => tranche.id)
  const dailyTranches = useDailyTranchesStates(tranchesIds)
  const theme = useTheme()
  const averageMaturity = useAverageMaturity(poolId)

  const expenseRatio = useMemo(() => {
    return (
      poolFees?.map((f) => f.amounts?.percentOfNav.toPercent().toNumber()).reduce((acc, f) => acc + (f ?? 0), 0) ?? 0
    )
  }, [poolFees])

  const tranchesAPY = useMemo(() => {
    const thirtyDayAPY = getTodayValue(dailyTranches)
    if (!thirtyDayAPY) return null

    return Object.keys(thirtyDayAPY).map((key) => {
      return thirtyDayAPY[key][0].yield30DaysAnnualized
        ? formatPercentage(thirtyDayAPY[key][0].yield30DaysAnnualized)
        : null
    })
  }, [dailyTranches])

  const minInvestmentPerTranche = useMemo(() => {
    if (!metadata?.tranches) return null

    return Object.values(metadata.tranches).map((item) => {
      const minInv = new CurrencyBalance(item.minInitialInvestment ?? 0, pool.currency.decimals).toDecimal()
      return item.minInitialInvestment ? formatBalanceAbbreviated(minInv, '', 0) : null
    })
  }, [metadata?.tranches, pool.currency.decimals])

  const isBT3BT4 =
    poolId.toLowerCase() === '0x90040f96ab8f291b6d43a8972806e977631affde' ||
    poolId.toLowerCase() === '0x55d86d51ac3bcab7ab7d2124931fba106c8b60c7'

  const metrics = [
    {
      metric: 'Asset type',
      value: `${capitalize(startCase(metadata?.pool?.asset?.class))} - ${metadata?.pool?.asset?.subClass}`,
    },
    {
      metric: '30-day APY',
      value: tranchesAPY?.length
        ? tranchesAPY.map((tranche, index) => {
            return tranche && `${tranche} ${index !== tranchesAPY?.length - 1 ? '-' : ''} `
          })
        : '-',
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
      metric: 'Min. investment',
      value: minInvestmentPerTranche?.length
        ? minInvestmentPerTranche.map((tranche, index) => {
            return tranche && `${tranche} ${index !== minInvestmentPerTranche?.length - 1 ? '-' : ''} `
          })
        : '-',
    },
    {
      metric: 'Investor type',
      value: metadata?.pool?.investorType ? metadata?.pool?.investorType : '-',
    },
    ...(!isTinlakePool
      ? [
          {
            metric: 'Available networks',
            value: <AvailableNetworks poolId={poolId} />,
          },
        ]
      : []),

    {
      metric: 'Pool structure',
      value: metadata?.pool?.poolStructure ? metadata?.pool?.poolStructure : '-',
    },
    ...(metadata?.pool?.poolRatings?.length
      ? metadata?.pool?.poolRatings.map((rating) => ({
          metric: 'Rating',
          value: (
            <Tooltip
              delay={300}
              bodyWidth="maxContent"
              body={<TooltipBody title={rating.agency ?? ''} subtitle="View Report" url={rating.reportUrl ?? ''} />}
            >
              <Box
                border={`1px solid ${theme.colors.backgroundInverted}`}
                borderRadius={20}
                padding="2px 10px"
                display="flex"
              >
                {rating.agency?.includes('moody') ? <IconMoody size={16} /> : <IconSp size={16} />}
                <Text>{rating.value}</Text>
              </Box>
            </Tooltip>
          ),
        }))
      : []),

    {
      metric: <Tooltips type="expenseRatio" size="med" />,
      value: expenseRatio ? `${formatBalance(expenseRatio, '', 2)}%` : '-',
    },
  ]

  return (
    <Card p={2}>
      <Stack gap={1}>
        <Box display="flex" justifyContent="space-between" marginTop={2}>
          <Text variant="body2" fontWeight="500">
            Overview
          </Text>
          <PoolStatus status={getPoolStatus(pool)} />
        </Box>
        <Box marginTop={2}>
          {metrics.map(({ metric, value }, index) => {
            return (
              <Box key={index} display="flex" justifyContent="space-between" paddingY={1}>
                <Text color="textSecondary" variant="body2" textOverflow="ellipsis" whiteSpace="nowrap">
                  {metric}
                </Text>
                <Text variant="body2" textOverflow="ellipsis" whiteSpace="nowrap">
                  {value}
                </Text>
              </Box>
            )
          })}
        </Box>
      </Stack>
    </Card>
  )
}

const TooltipBody = ({
  title,
  subtitle = 'View transactions',
  url,
  links,
}: {
  title: string
  subtitle?: string
  url?: string
  links?: { text: string; url: string }[]
}) => {
  return (
    <Box backgroundColor="backgroundInverted" display="flex" alignItems="center" borderRadius="8px">
      <Box display="flex" flexDirection="column" marginRight="12px">
        <Text fontWeight={500} variant="body3" color="white">
          {title}
        </Text>
        {links ? (
          links.map((link, index) => (
            <a key={index} target="_blank" rel="noopener noreferrer" href={link.url}>
              <Text variant="body3" color="white">
                {subtitle}
              </Text>
            </a>
          ))
        ) : (
          <a target="_blank" rel="noopener noreferrer" href={url}>
            <Text variant="body3" color="white">
              {subtitle}
            </Text>
          </a>
        )}
      </Box>
      <IconArrowRightWhite size="iconSmall" />
    </Box>
  )
}

const AvailableNetworks = ({ poolId }: { poolId: string }) => {
  const activeDomains = useActiveDomains(poolId)
  const pool = usePool(poolId)

  const renderTooltipBody = (networkName: string, tranches: Tranche[], baseUrl: string) => {
    const links = tranches.map((tranche) => ({
      text: `View ${tranche.currency.name.split(' ').at(-1)}`,
      url: `${baseUrl}/token/${tranche.id}`,
    }))

    return <TooltipBody title={networkName} links={links} />
  }

  return (
    <Shelf>
      {activeDomains.data?.length || import.meta.env.REACT_APP_COLLATOR_WSS_URL.includes('development') ? (
        <Tooltip
          bodyWidth="maxContent"
          bodyPadding={1}
          delay={300}
          body={<TooltipBody title="Centrifuge" url={`${import.meta.env.REACT_APP_SUBSCAN_URL}`} />}
        >
          <NetworkIcon size="iconSmall" network="centrifuge" />
        </Tooltip>
      ) : (
        <Spinner size="iconSmall" />
      )}
      {activeDomains.data
        ?.filter((domain) => domain.isActive)
        .map((domain) => {
          const chain = (evmChains as any)[domain.chainId]
          return (
            <Tooltip
              key={domain.poolManager}
              delay={300}
              bodyWidth="maxContent"
              bodyPadding={1}
              body={renderTooltipBody(chain.name, pool.tranches, chain.blockExplorerUrl)}
            >
              <NetworkIcon size="iconSmall" network={domain.chainId} />
            </Tooltip>
          )
        })}
    </Shelf>
  )
}
