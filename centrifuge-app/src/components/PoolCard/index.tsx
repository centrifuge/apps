import { CurrencyBalance, Rate, Token } from '@centrifuge/centrifuge-js'
import { Box, Card, Divider, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
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

export type PoolCardProps = {
  poolId?: string
  name?: string
  assetClass?: string
  valueLocked?: Decimal
  currencySymbol?: string
  apr?: Rate | null | undefined
  status?: PoolStatusKey
  iconUri?: string
  tranches?: Pick<Token, 'yield30DaysAnnualized' | 'interestRatePerSec' | 'currency' | 'id'>[]
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
  const renderText = (text: string) => (
    <Text fontWeight={500} as="h2" variant="body1">
      {text}
    </Text>
  )

  const tranchesData = tranches?.map((tranche) => {
    const words = tranche.currency.name.trim().split(' ')
    const metadata = metaData?.tranches[tranche.id] ?? null
    const trancheName = words[words.length - 1]
    const investmentBalance = new CurrencyBalance(
      metadata?.minInitialInvestment ?? 0,
      tranche.currency.decimals
    ).toDecimal()

    const daysSinceCreation = createdAt ? daysBetween(createdAt, new Date()) : 0

    function calculateApy() {
      if (poolId === '4139607887') return formatPercentage(5, true, {}, 1)
      if (poolId === '1655476167') return formatPercentage(15, true, {}, 1)
      if (daysSinceCreation > 30 && tranche.yield30DaysAnnualized)
        return formatPercentage(tranche.yield30DaysAnnualized, true, {}, 1)
      if (tranche.interestRatePerSec) return formatPercentage(tranche.interestRatePerSec.toAprPercent(), true, {}, 1)
      return '-'
    }

    return {
      name: trancheName,
      apr: calculateApy(),
      minInvestment:
        metadata && metadata.minInitialInvestment ? formatBalanceAbbreviated(investmentBalance, '', 0) : '-',
    }
  })

  return (
    <StyledCard>
      <RouterTextLink to={`${poolId}`} style={{ textDecoration: 'none' }}>
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
          width={isOneTranche ? '50%' : '100%'}
        >
          {!isOneTranche && (
            <Stack>
              <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
                Tranches
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
              Min Investment
            </Text>
            {tranchesData?.map((tranche) => renderText(`${tranche.minInvestment}`))}
          </Stack>
        </Box>
        {metaData?.pool?.issuer?.shortDescription && (
          <Box marginY={12}>
            <Text as="p" variant="body2" color="textButtonPrimaryDisabled">
              {metaData?.pool?.issuer?.shortDescription}
            </Text>
          </Box>
        )}
        <Box display="flex" justifyContent="space-between">
          <Text variant="body2">{assetClass && 'Asset Type'}</Text>
          <Text variant="body2">{assetClass ?? ''}</Text>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Text variant="body2">{metaData?.pool?.investorType && 'Investor Type'}</Text>
          <Text variant="body2"> {metaData?.pool?.investorType ?? ''}</Text>
        </Box>
      </RouterTextLink>
    </StyledCard>
  )
}
