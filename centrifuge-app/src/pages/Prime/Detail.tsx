import { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { BackButton, Box, Stack, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { AssetSummary } from '../../../src/components/AssetSummary'
import { LayoutSection } from '../../../src/components/LayoutBase/LayoutSection'
import { CardPortfolioValue } from '../../../src/components/Portfolio/CardPortfolioValue'
import { Transactions } from '../../../src/components/Portfolio/Transactions'
import { Resolutions } from '../../../src/components/Resolutions'
import { RouterLinkButton } from '../../../src/components/RouterLinkButton'
import { config } from '../../../src/config'
import { Dec } from '../../../src/utils/Decimal'
import { formatBalance, formatPercentage } from '../../../src/utils/formatting'
import { Holdings, useHoldings } from '../../components/Portfolio/Holdings'
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
  const realizedProfit = tokens.reduce(
    (sum, token) => sum.add(token.realizedProfit ? token.realizedProfit.toDecimal() : 0),
    Dec(0)
  )
  const unrealizedProfit = tokens.reduce(
    (sum, token) => sum.add(token.unrealizedProfit ? token.unrealizedProfit.toDecimal() : 0),
    Dec(0)
  )

  const yieldSinceInception = tokens.find((token) => token.yieldSinceInception)?.yieldSinceInception

  return !isLoading && dao && centAddress ? (
    <Stack mx={1} my={1}>
      <Box mt={2} mb={2}>
        <BackButton label={`${dao.name} Investements`} to="/prime" align="flex-start" as={RouterLinkButton} />
      </Box>
      <AssetSummary
        data={[
          {
            label: 'Portfolio Value',
            value: formatBalance(currentPortfolioValue || 0, 'USD'),
            heading: false,
            children: yieldSinceInception ? (
              <Box backgroundColor={theme.colors.statusOkBg} padding="4px" borderRadius={4}>
                <Text
                  variant="body4"
                  color={yieldSinceInception?.isNeg() ? 'statusCritical' : 'statusOk'}
                  style={{ fontWeight: 500 }}
                >
                  {yieldSinceInception?.isNeg() ? '-' : '+'}
                  {formatPercentage(yieldSinceInception)}
                </Text>
                <Text variant="body4" color={yieldSinceInception?.isNeg() ? 'statusCritical' : 'statusOk'}>
                  Since inception
                </Text>
              </Box>
            ) : null,
          },
          {
            label: 'Realized P&L',
            value: formatBalance(realizedProfit, config.baseCurrency),
            heading: false,
          },
          {
            label: 'Unrealized P&L',
            value: formatBalance(unrealizedProfit, config.baseCurrency),
            heading: false,
          },
        ]}
      />
      <Box mt={3}>
        <CardPortfolioValue address={centAddress} />
      </Box>

      <LayoutSection mt={3} pt={0} gap={0}>
        <Text variant="heading4">Investment positions</Text>
        <Holdings address={centAddress} showActions={false} />
      </LayoutSection>
      <LayoutSection mt={1} pt={0}>
        <Transactions address={centAddress} title="Transaction history" />
      </LayoutSection>
      <LayoutSection mt={1} pt={0}>
        <Text variant="heading4">Resolutions</Text>
        <Resolutions dao={dao} />
      </LayoutSection>
    </Stack>
  ) : null
}
