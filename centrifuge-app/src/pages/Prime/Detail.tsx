import { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Stack, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { AssetSummary } from '../../../src/components/AssetSummary'
import { BackButton } from '../../../src/components/BackButton'
import { CardPortfolioValue } from '../../../src/components/Portfolio/CardPortfolioValue'
import { useDailyPortfolioValue } from '../../../src/components/Portfolio/usePortfolio'
import { config } from '../../../src/config'
import { Dec } from '../../../src/utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../../src/utils/formatting'
import { useTransactionsByAddress } from '../../../src/utils/usePools'
import { useHoldings } from '../../components/Portfolio/Holdings'
import { useDAOConfig } from '../../utils/useDAOConfig'

export default function PrimeDetailPage() {
  return <PrimeDetail />
}

const PrimeDetail = () => {
  const theme = useTheme()
  const { dao: daoSlug } = useParams<{ dao: string }>()
  const { data: DAOs, isLoading } = useDAOConfig()
  const dao = DAOs?.find((d) => d.slug === daoSlug)
  const utils = useCentrifugeUtils()
  const centAddress =
    dao &&
    (typeof dao.network === 'number'
      ? utils.evmToSubstrateAddress(dao.address, dao.network)
      : addressToHex(dao.address))

  const tokens = useHoldings(centAddress)
  const currentPortfolioValue = tokens.reduce((sum, token) => sum.add(token.position.mul(token.tokenPrice)), Dec(0))
  const transactions = useTransactionsByAddress(centAddress)
  const dailyPortfolioValue = useDailyPortfolioValue(centAddress ?? '', 90)

  const chartData = dailyPortfolioValue?.map((day) => ({
    name: day.dateInMilliseconds,
    yAxis: day.portfolioValue.toNumber(),
  }))

  const filters = {
    type: 'default',
    title: 'Overview',
    legend: [
      {
        label: 'Portfolio value',
        color: 'textGold',
        value: '1,523.00',
      },
    ],
  }

  const valueFormatter = (value: any) => {
    return { value: formatBalanceAbbreviated(value.yAxis, '', 2), label: 'Portfolio Value' }
  }

  return !isLoading && dao && centAddress ? (
    <Stack mx={1} my={1}>
      <BackButton label={`${dao.name} Investements`} to="/prime" align="flex-start" />
      <AssetSummary
        data={[
          {
            label: 'Portfolio Value',
            value: formatBalance(currentPortfolioValue || 0, ''),
            heading: false,
            children: (
              <Box backgroundColor={theme.colors.statusOkBg} padding="4px" borderRadius={4}>
                <Text variant="body4" color="statusOk" style={{ fontWeight: 500 }}>
                  +25
                </Text>
                <Text variant="body4" color="statusOk">
                  Since inception
                </Text>
              </Box>
            ),
          },
          {
            label: 'Realized P&L',
            value: formatBalance(0, config.baseCurrency),
            heading: false,
          },
          {
            label: 'Unrealized P&L',
            value: formatBalance(0, config.baseCurrency),
            heading: false,
          },
        ]}
      />
      <Box mt={3} mx={[2, 2, 2, 2, 5]}>
        <CardPortfolioValue address={centAddress} />
      </Box>

      {/* <LayoutSection title="Holdings" pt={12} pb={12}>
        <Holdings address={centAddress} showActions={false} />
      </LayoutSection>
      <LayoutSection title="Transaction history" pt={12} pb={12}>
        <Transactions onlyMostRecent address={centAddress} />
      </LayoutSection>
      <Resolutions dao={dao} /> */}
    </Stack>
  ) : null
}
