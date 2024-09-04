import { CurrencyBalance, Rate } from '@centrifuge/centrifuge-js'
import { Box, Card, Divider, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { CardHeader } from '../ListItemCardStyles'
import { RouterTextLink } from '../TextLink'
import { PoolStatus, PoolStatusKey } from './PoolStatus'

type TrancheData = {
  name: string
  apr: string
  minInvestment: string
}

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
export type Tranche = {
  id: string
  currency: {
    name: string
    decimals: CurrencyBalance | number
  }
  interestRatePerSec: {
    toAprPercent: () => Decimal
  } | null
  capacity?: CurrencyBalance | number
  metadata?: MetaData
}

const StyledRouterTextLink = styled(RouterTextLink)`
  font-size: 12px;
  margin-top: 8px;
  text-decoration: none;
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
  tranches?: Tranche[]
  metaData?: MetaData
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
}: PoolCardProps) {
  const navigate = useNavigate()
  const isOneTranche = tranches && tranches?.length === 1
  const renderText = (text: string) => (
    <Text fontWeight={500} as="h2" variant="body1">
      {text}
    </Text>
  )

  const tranchesData: TrancheData[] = tranches?.map((tranche: Tranche) => {
    const words = tranche.currency.name.trim().split(' ')
    const metadata = metaData?.tranches[tranche.id] ?? null
    const trancheName = words[words.length - 1]

    return {
      name: trancheName,
      apr: tranche.interestRatePerSec
        ? formatPercentage(tranche.interestRatePerSec.toAprPercent(), true, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : '-',
      minInvestment:
        metadata && metadata.minInitialInvestment
          ? formatBalanceAbbreviated(Number(metadata.minInitialInvestment), '', 0)
          : '-',
    }
  }) as TrancheData[]

  return (
    <Card
      marginRight={20}
      marginBottom={20}
      onClick={() => navigate(`/pools/${poolId}`)}
      padding={18}
      style={{ cursor: 'pointer' }}
      height={320}
    >
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
          <Thumbnail type="pool" label="LP" size="small" />
        )}
      </CardHeader>
      <Divider />
      <Box display="flex" justifyContent="space-between" alignItems="center" marginY="8px">
        <Text as="span" variant="body3" color="textButtonPrimaryDisabled">
          TVL ({currencySymbol})
        </Text>
        <Text variant="heading1">{valueLocked ? formatBalance(valueLocked, '') : '-'}</Text>
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
        <Text variant="body2">Asset Type</Text>
        <Text variant="body2">{assetClass ?? '-'}</Text>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Text variant="body2">Investor Type</Text>
        <Text variant="body2"> {metaData?.pool?.investorType || '-'}</Text>
      </Box>
    </Card>
  )
}
