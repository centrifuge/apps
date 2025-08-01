import { DailyTrancheState, PoolMetadata, Price } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalanceAbbreviated, useCentrifuge } from '@centrifuge/centrifuge-react'
import {
  Box,
  Card,
  IconArrowRightWhite,
  IconMoody,
  IconParticula,
  IconSp,
  Shelf,
  Stack,
  Text,
  Tooltip,
} from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { Decimal } from '../../../src/utils/Decimal'
import { evmChains } from '../../config'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { useDailyTranchesStates, usePool, usePoolMetadata } from '../../utils/usePools'
import { PoolStatus } from '../PoolCard/PoolStatus'
import { getPoolStatus } from '../PoolList'
import { Spinner } from '../Spinner'
import { Tooltips } from '../Tooltips'

type Props = {
  poolId: string
}

type PartialDailyTrancheState = Pick<DailyTrancheState, 'yield90DaysAnnualized'> & {
  tokenPrice: Price
  timestamp: string
}

type DailyTrancheStateArr = Record<string, PartialDailyTrancheState[]>

type Tranche = Pick<DailyTrancheState, 'id'> & {
  currency: {
    name: string
  }
}

type TinlakeDataKey = keyof typeof tinlakeData

type RatingProps = Partial<NonNullable<PoolMetadata['pool']['poolRatings']>[number]>

const ratingIcons: { [key: string]: JSX.Element } = {
  "Moody's": <IconMoody size={16} />,
  Particula: <IconParticula size={16} />,
}

const tinlakeData = {
  '0x53b2d22d07E069a3b132BfeaaD275b10273d381E': '7% - 15%',
  '0x55d86d51Ac3bcAB7ab7d2124931FbA106c8b60c7': '4% - 15%',
  '0x90040F96aB8f291b6d43A8972806e977631aFFdE': '4% - 15%',
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
  const tranchesIds = pool.tranches.map((tranche) => tranche.id)
  const dailyTranches = useDailyTranchesStates(tranchesIds)

  const tranchesAPY = useMemo(() => {
    // TODO: fix when we apy issue is solve, for now we will just use target
    // const apy = getTodayValue(dailyTranches)
    // if (!apy) return null

    // return Object.keys(apy)
    //   .map((key) => {
    //     return apy[key][0].yield90DaysAnnualized ? apy[key][0].yield90DaysAnnualized.toPercent().toNumber() : 0
    //   })
    //   .sort((a, b) => a - b)
    return [Object.values(metadata?.tranches ?? {})[0]?.apyPercentage]
  }, [dailyTranches])

  const minInvestmentPerTranche = useMemo(() => {
    if (!metadata?.tranches) return null

    return Object.values(metadata.tranches).map((item) => {
      return item.minInitialInvestment ? new Decimal(item.minInitialInvestment) : null
    })
  }, [metadata?.tranches])

  const weightedAverageMaturity = useMemo(() => {
    if (!metadata?.tranches) return null

    return Object.values(metadata.tranches)
      .map((item) => {
        return item.weightedAverageMaturity ? item.weightedAverageMaturity : null
      })
      .filter(Boolean)
  }, [metadata?.tranches])

  const metrics = [
    {
      metric: 'Asset type',
      value: `${capitalize(startCase(metadata?.pool?.asset?.class))} - ${metadata?.pool?.asset?.subClass}`,
    },
    {
      metric: isTinlakePool ? '90-day APY' : 'APY',
      value: tinlakeData[poolId as TinlakeDataKey]
        ? tinlakeData[poolId as TinlakeDataKey]
        : tranchesAPY.map((tranche, index) => {
            const formatted = formatPercentage(tranche ?? 0)
            return formatted && `${formatted} ${index !== tranchesAPY?.length - 1 ? '-' : ''}`
          }),
    },
    {
      metric: 'Min. investment',
      value: minInvestmentPerTranche?.length
        ? minInvestmentPerTranche
            .sort((a, b) => Number(a) - Number(b))
            .map((tranche, index) => {
              const formatted = formatBalanceAbbreviated(tranche ?? 0, '', 0)
              return tranche && `$${formatted} ${index !== minInvestmentPerTranche?.length - 1 ? '-' : ''} `
            })
        : '-',
    },
    {
      metric: 'Investor type',
      value: metadata?.pool?.investorType ?? '-',
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
      value: metadata?.pool?.poolStructure ?? '-',
    },
    ...(metadata?.pool?.poolRatings?.length && metadata?.pool?.poolRatings[0]?.agency !== ''
      ? [
          {
            metric: 'Rating',
            value: (
              <Shelf gap={1}>
                {metadata.pool.poolRatings.map((rating) => (
                  <RatingPill key={rating.agency} {...(rating as RatingProps)} />
                ))}
              </Shelf>
            ),
          },
        ]
      : []),
    {
      metric: <Tooltips type="expenseRatio" size="med" />,
      value: metadata?.pool?.expenseRatio ? `${formatBalance(metadata?.pool?.expenseRatio, '', 2)}%` : '-',
    },
    {
      metric: 'Weighted Average Maturity',
      value: weightedAverageMaturity?.length
        ? weightedAverageMaturity.map((tranche, index) => {
            const formatted = formatPercentage(tranche ?? 0, false)
            return tranche && `${formatted} ${index !== weightedAverageMaturity?.length - 1 ? '-' : ''}`
          })
        : '-',
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
          {metrics?.map(({ metric, value }, index) => {
            return (
              <Box key={index} display="flex" justifyContent="space-between" paddingY={1} alignItems="center">
                <Text
                  textTransform="capitalize"
                  color="textSecondary"
                  variant="body2"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {metric}
                </Text>
                <Text textTransform="capitalize" variant="body2" textOverflow="ellipsis" whiteSpace="nowrap">
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
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }
  return (
    <Box backgroundColor="backgroundInverted" display="flex" alignItems="center" borderRadius="8px">
      <Box display="flex" flexDirection="column" marginRight="12px">
        <Text fontWeight={500} variant="body3" color="white">
          {title}
        </Text>
        {links ? (
          links.map((link, index) => (
            <Shelf key={`${link.text}-${index}`}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
                <Text variant="body3" color="white">
                  {link.text}
                </Text>
              </a>
              <IconArrowRightWhite size="iconSmall" />
            </Shelf>
          ))
        ) : (
          <Shelf>
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
              <Text variant="body3" color="white">
                {subtitle}
              </Text>
            </a>
            <IconArrowRightWhite size="iconSmall" />
          </Shelf>
        )}
      </Box>
    </Box>
  )
}

const AvailableNetworks = ({ poolId }: { poolId: string }) => {
  const activeDomains = useActiveDomains(poolId)
  const pool = usePool(poolId)

  const renderTooltipBody = (networkName: string, tranches: Tranche[], baseUrl: string) => {
    const links = tranches
      .map(
        (tranche) => activeDomains?.data?.find((domain) => domain.trancheTokens[tranche.id])?.trancheTokens[tranche.id]
      )
      .filter(Boolean)
      .map((tokenAddress) => ({
        text: `View Transactions`,
        url: `${baseUrl}token/${tokenAddress}`,
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
        ?.filter((domain) => domain.isActive && domain.chainId !== 5)
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

export const RatingPill = ({ agency, reportUrl, reportFile, value }: RatingProps) => {
  const theme = useTheme()
  const cent = useCentrifuge()
  return (
    <Box key={`${agency}-${reportUrl}`}>
      <Tooltip
        triggerStyle={{ textDecoration: 'none' }}
        bodyWidth="maxContent"
        body={
          <TooltipBody
            title={agency ?? ''}
            links={[
              { text: 'Go to report', url: reportUrl ?? '' },
              ...(reportFile
                ? [
                    {
                      text: 'View PDF report',
                      url: cent.metadata.parseMetadataUrl(reportFile?.uri ?? '') || '',
                    },
                  ]
                : []),
            ]}
          />
        }
      >
        <Box
          border={`1px solid ${theme.colors.backgroundInverted}`}
          borderRadius={20}
          padding="2px 0px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pl={1}
          pr={1}
        >
          {agency && ratingIcons[agency] ? ratingIcons[agency] : <IconSp size={16} />}
          <Text variant="body2" style={{ marginLeft: 4 }}>
            {value}
          </Text>
        </Box>
      </Tooltip>
    </Box>
  )
}
