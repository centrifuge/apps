import { CurrencyBalance, Rate, Token } from '@centrifuge/centrifuge-js'
import { Box, Card, Divider, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import styled, { useTheme } from 'styled-components'
import { daysBetween } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { CardHeader } from '../ListItemCardStyles'
import { RouterTextLink } from '../TextLink'
import { PoolStatus, PoolStatusKey } from './PoolStatus'

export type InnerMetadata = {
  minInitialInvestment?: CurrencyBalance
}

export type MetaData = {
  tranches: {
    [key: string]: InnerMetadata
  }
  pool: {
    issuer: {
      shortDescription?: string
    }
    investorType?: string
  }
}

type TrancheWithCurrency = Pick<Token, 'yield30DaysAnnualized' | 'interestRatePerSec' | 'currency' | 'id' | 'seniority'>

const StyledRouterTextLink = styled(RouterTextLink)`
  font-size: 12px;
  margin-top: 8px;
  text-decoration: none;
`
const StyledCard = styled(Card)`
  width: 100%;
  max-width: 100%;
  height: 300px;

  margin-right: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid rgba(207, 207, 207, 0.5);

  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.textPrimary};
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['M']}) {
    width: auto;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['XL']}) {
    width: auto;
  }
`

const tinlakeTranches = {
  NS2: {
    name: 'New Silver 3',
    tranches: [
      { name: 'Junior', apr: '15%', minInvestment: '-' },
      { name: 'Senior', apr: '7%', minInvestment: '5K' },
    ],
    shortDescription: ' Real estate bridge loans for fix and flip projects, maturing in 12-24 months.',
    investorType: 'Qualified Investors',
  },
  BT3: {
    name: 'BlockTower Series 3',
    tranches: [
      { name: 'Junior', apr: '15%', minInvestment: '-' },
      { name: 'Senior', apr: '4%', minInvestment: '-' },
    ],
    shortDescription: ' Investment-grade consumer ABS, auto ABS, and CLOs under 4 years.',
    investorType: 'Private',
  },
  BT4: {
    name: 'BlockTower Series 4',
    tranches: [
      { name: 'Junior', apr: '15%', minInvestment: '-' },
      { name: 'Senior', apr: '4%', minInvestment: '-' },
    ],
    shortDescription: 'Investment-grade consumer ABS, auto ABS, and CLOs under 4 years.',
    investorType: 'Private',
  },
  none: {
    name: '-',
    tranches: [
      { name: 'Junior', apr: '-', minInvestment: '-' },
      { name: 'Senior', apr: '-', minInvestment: '-' },
    ],
    shortDescription: '',
    investorType: '-',
  },
}

export const DYF_POOL_ID = '1655476167'
export const NS3_POOL_ID = '1615768079'

export type CentrifugeTargetAPYs = keyof typeof centrifugeTargetAPYs
export const centrifugeTargetAPYs = {
  [DYF_POOL_ID]: ['15%'],
  [NS3_POOL_ID]: ['8.0%', '16%'],
}

type TinlakeTranchesKey = keyof typeof tinlakeTranches

export type PoolCardProps = {
  poolId?: string
  name?: string
  assetClass?: string
  valueLocked?: Decimal
  currencySymbol?: string
  apr?: Rate | null | undefined
  status?: PoolStatusKey
  iconUri?: string
  tranches?: TrancheWithCurrency[]
  metaData?: MetaData
  createdAt?: string
}

export function PoolCard({
  poolId,
  name,
  assetClass,
  valueLocked,
  currencySymbol,
  status,
  iconUri,
  tranches,
  metaData,
  createdAt,
}: PoolCardProps) {
  const theme = useTheme()
  const isOneTranche = tranches && tranches?.length === 1
  const isTinlakePool = poolId?.startsWith('0x')

  const tinlakeKey = (Object.keys(tinlakeTranches).find(
    (key) => tinlakeTranches[key as TinlakeTranchesKey].name === name
  ) || 'none') as TinlakeTranchesKey

  const renderText = (text: string, isApr?: boolean) => {
    if (isApr && poolId === NS3_POOL_ID) {
      return (
        <Box display="flex">
          <Text fontWeight={500} as="h2" variant={isOneTranche ? 'heading1' : 'body1'} style={{ width: 35 }}>
            {text}
          </Text>
          <Text variant="label2" style={{ alignSelf: 'flex-end', marginLeft: '4px' }}>
            Target
          </Text>
        </Box>
      )
    }
    return (
      <Text fontWeight={500} as="h2" variant={isOneTranche ? 'heading1' : 'body1'}>
        {text}
      </Text>
    )
  }

  const calculateApy = (tranche: TrancheWithCurrency) => {
    const daysSinceCreation = createdAt ? daysBetween(createdAt, new Date()) : 0
    if (poolId === DYF_POOL_ID) return centrifugeTargetAPYs[DYF_POOL_ID][0]
    if (poolId === NS3_POOL_ID && tranche.seniority === 0) return centrifugeTargetAPYs[NS3_POOL_ID][0]
    if (poolId === NS3_POOL_ID && tranche.seniority === 1) return centrifugeTargetAPYs[NS3_POOL_ID][1]
    if (daysSinceCreation > 30 && tranche.yield30DaysAnnualized)
      return formatPercentage(tranche.yield30DaysAnnualized, true, {}, 1)
    if (tranche.interestRatePerSec) {
      return formatPercentage(tranche.interestRatePerSec.toAprPercent(), true, {}, 1)
    }
    return '-'
  }

  const tranchesData = useMemo(() => {
    return tranches
      ?.map((tranche: TrancheWithCurrency) => {
        const words = tranche.currency.name.trim().split(' ')
        const metadata = metaData?.tranches[tranche.id] ?? null
        const trancheName = words[words.length - 1]
        const investmentBalance = new CurrencyBalance(
          metadata?.minInitialInvestment ?? 0,
          tranche.currency.decimals
        ).toDecimal()

        return {
          name: trancheName,
          apr: isTinlakePool
            ? tinlakeTranches[tinlakeKey].tranches.find((t) => t.name === trancheName)?.apr
            : calculateApy(tranche),
          minInvestment: isTinlakePool
            ? tinlakeTranches[tinlakeKey].tranches.find((t) => t.name === trancheName)?.minInvestment
            : metadata && metadata.minInitialInvestment
            ? `$${formatBalanceAbbreviated(investmentBalance, '', 0)}`
            : '-',
        }
      })
      .reverse()
  }, [calculateApy, isTinlakePool, metaData?.tranches, tinlakeKey, tranches])

  return (
    <RouterTextLink to={`${poolId}`} style={{ textDecoration: 'none' }}>
      <StyledCard>
        <CardHeader marginBottom={12}>
          <Box>
            <PoolStatus status={status} />
            <Text as="h2" fontWeight={500} style={{ marginTop: 4 }} variant="body1">
              {name}
            </Text>
          </Box>
          {iconUri ? (
            <Box
              as="img"
              src={iconUri}
              alt=""
              height={38}
              width={38}
              border={`1px solid ${theme.colors.backgroundTertiary}`}
              borderRadius={4}
            />
          ) : (
            <Thumbnail type="pool" label="LP" size="large" />
          )}
        </CardHeader>
        <Divider />
        <Box display="flex" justifyContent="space-between" alignItems="center" marginY="8px">
          <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
            {currencySymbol && `TVL (${currencySymbol})`}
          </Text>
          <Text variant="heading1">{valueLocked ? formatBalance(valueLocked, '') : ''}</Text>
        </Box>
        <Box
          bg={isOneTranche ? 'white' : 'backgroundSecondary'}
          marginY="8px"
          borderRadius={4}
          padding={isOneTranche ? 0 : '8px'}
          display="flex"
          justifyContent="space-between"
          width={isOneTranche ? '60%' : '100%'}
        >
          {!isOneTranche && (
            <Stack>
              <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
                Tranche
              </Text>
              {tranchesData?.map((tranche) => renderText(tranche.name))}
              {tranches && tranches.length > 2 ? (
                <StyledRouterTextLink to={`/pools/${poolId}`}>View all</StyledRouterTextLink>
              ) : null}
            </Stack>
          )}
          <Stack>
            <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
              {poolId === DYF_POOL_ID ? 'Target' : 'APY'}
            </Text>
            {tranchesData?.map((tranche) => renderText(`${tranche.apr}`, true))}
          </Stack>
          <Stack>
            <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
              Min. investment
            </Text>
            {tranchesData?.map((tranche) => renderText(`${tranche.minInvestment}`))}
          </Stack>
        </Box>
        {(metaData?.pool?.issuer?.shortDescription || isTinlakePool) && (
          <Box marginY={12}>
            <Text as="p" variant="body3" color="textButtonPrimaryDisabled">
              {isTinlakePool ? tinlakeTranches[tinlakeKey].shortDescription : metaData?.pool?.issuer?.shortDescription}
            </Text>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" mt={1}>
          <Text variant="body3">Asset type</Text>
          <Text variant="body3">{assetClass ?? '-'}</Text>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Text variant="body3">Investor type</Text>
          <Text variant="body3">
            {isTinlakePool ? tinlakeTranches[tinlakeKey].investorType : metaData?.pool?.investorType ?? '-'}
          </Text>
        </Box>
      </StyledCard>
    </RouterTextLink>
  )
}
