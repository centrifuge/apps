import { CurrencyBalance, Rate, Token } from '@centrifuge/centrifuge-js'
import { Box, Card, Divider, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import styled from 'styled-components'
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

type TinlakeTranchesKey = 'silver' | 'blocktowerThree' | 'blocktowerFour'

type TrancheWithCurrency = Pick<Token, 'yield30DaysAnnualized' | 'interestRatePerSec' | 'currency' | 'id'>

const StyledRouterTextLink = styled(RouterTextLink)`
  font-size: 12px;
  margin-top: 8px;
  text-decoration: none;
`
const StyledCard = styled(Card)`
  width: 100%;
  max-width: 100%;
  height: 320px;

  margin-right: 12px;
  margin-bottom: 12px;
  padding: 12px;

  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.backgroundInverted};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['M']}) {
    width: auto;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints['XL']}) {
    width: auto;
  }
`

const tinlakeTranches = {
  silver: {
    Junior: '15%',
    Senior: '7%',
    shortDescription: ' Real estate bridge loans for fix and flip projects, maturing in 12-24 months.',
    InvestorType: 'Qualified Investors',
  },
  blocktowerThree: {
    Junior: '15%',
    Senior: '4% - 15%',
    shortDescription: ' Investment-grade consumer ABS, auto ABS, and CLOs under 4 years.',
    InvestorType: 'Private',
  },
  blocktowerFour: {
    Junior: '15%',
    Senior: '4%',
    shortDescription: 'Investment-grade consumer ABS, auto ABS, and CLOs under 4 years.',
    InvestorType: 'Private',
  },
  none: {
    Junior: '-',
    Senior: '-',
    shortDescription: '',
    InvestorType: '-',
  },
}

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
  const isOneTranche = tranches && tranches?.length === 1
  const isTinlakePool =
    poolId === '0x53b2d22d07E069a3b132BfeaaD275b10273d381E' ||
    poolId === '0x90040F96aB8f291b6d43A8972806e977631aFFdE' ||
    poolId === '0x55d86d51Ac3bcAB7ab7d2124931FbA106c8b60c7'

  const tinlakeObjKey = () => {
    if (name?.includes('Silver')) return 'silver'
    else if (name?.includes('BlockTower Series 3')) return 'blocktowerThree'
    else if (name?.includes('BlockTower Series 4')) return 'blocktowerFour'
    else return 'none'
  }

  const getTinlakeMinInvestment = (trancheName: 'Junior' | 'Senior') => {
    if (name?.includes('Silver') && trancheName === 'Senior') return '5K'
    else return '-'
  }

  const renderText = (text: string) => (
    <Text fontWeight={500} as="h2" variant={isOneTranche ? 'heading1' : 'body1'}>
      {text}
    </Text>
  )

  const calculateApy = (tranche: TrancheWithCurrency) => {
    const daysSinceCreation = createdAt ? daysBetween(createdAt, new Date()) : 0
    if (daysSinceCreation > 30 && tranche.yield30DaysAnnualized)
      return formatPercentage(tranche.yield30DaysAnnualized, true, {}, 1)
    if (tranche.interestRatePerSec) return formatPercentage(tranche.interestRatePerSec.toAprPercent(), true, {}, 1)
    return '-'
  }

  const tranchesData = useMemo(() => {
    return tranches
      ?.map((tranche: TrancheWithCurrency) => {
        const key = tinlakeObjKey() as TinlakeTranchesKey
        const words = tranche.currency.name.trim().split(' ')
        const metadata = metaData?.tranches[tranche.id] ?? null
        const trancheName = words[words.length - 1]
        const investmentBalance = new CurrencyBalance(
          metadata?.minInitialInvestment ?? 0,
          tranche.currency.decimals
        ).toDecimal()

        return {
          name: trancheName,
          apr: isTinlakePool ? tinlakeTranches[key][trancheName as 'Junior' | 'Senior'] : calculateApy(tranche),
          minInvestment: isTinlakePool
            ? getTinlakeMinInvestment(trancheName as 'Junior' | 'Senior')
            : metadata && metadata.minInitialInvestment
            ? `$${formatBalanceAbbreviated(investmentBalance, '', 0)}`
            : '-',
        }
      })
      .reverse()
  }, [calculateApy, getTinlakeMinInvestment])

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
            <Box as="img" src={iconUri} alt="" height={38} width={38} borderRadius="4px" />
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
              APY
            </Text>
            {tranchesData?.map((tranche) => renderText(`${tranche.apr}`))}
          </Stack>
          <Stack>
            <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
              Min. investment
            </Text>
            {tranchesData?.map((tranche) => renderText(`${tranche.minInvestment}`))}
          </Stack>
        </Box>
        {metaData?.pool?.issuer?.shortDescription ||
          (isTinlakePool && (
            <Box marginY={12}>
              <Text as="p" variant="body2" color="textButtonPrimaryDisabled">
                {isTinlakePool
                  ? tinlakeTranches[tinlakeObjKey()].shortDescription
                  : metaData?.pool?.issuer?.shortDescription}
              </Text>
            </Box>
          ))}
        <Box display="flex" justifyContent="space-between">
          <Text variant="body2">Asset type</Text>
          <Text variant="body2">{assetClass ?? '-'}</Text>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Text variant="body2">Investor type</Text>
          <Text variant="body2">
            {' '}
            {isTinlakePool ? tinlakeTranches[tinlakeObjKey()].InvestorType : metaData?.pool?.investorType ?? '-'}
          </Text>
        </Box>
      </StyledCard>
    </RouterTextLink>
  )
}
