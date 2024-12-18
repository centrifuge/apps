import { addressToHex } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { Resolutions } from '../../components/Resolutions'
import { RouterTextLink } from '../../components/TextLink'
import { useDAOConfig } from '../../utils/useDAOConfig'

export default function PrimeDetailPage() {
  return <PrimeDetail />
}

function PrimeDetail() {
  const { dao: daoSlug } = useParams<{ dao: string }>()
  const { data: DAOs, isLoading } = useDAOConfig()
  const dao = DAOs?.find((d) => d.slug === daoSlug)
  const utils = useCentrifugeUtils()
  const centAddress =
    dao &&
    (typeof dao.network === 'number'
      ? utils.evmToSubstrateAddress(dao.address, dao.network)
      : addressToHex(dao.address))

  return !isLoading && dao && centAddress ? (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" pt={12} pb={12}>
        <Text variant="body3">
          <Text color="textSecondary">
            <RouterTextLink to="/prime" style={{ textDecoration: 'none' }}>
              Prime
            </RouterTextLink>
          </Text>{' '}
          / {dao.name} Investments
        </Text>
        <Shelf gap={2}>
          <Box as="img" src={dao.logo} alt={dao.name} width="iconRegular" height="iconRegular" borderRadius="50%" />
          <Text variant="heading1">{dao.name} Investments</Text>
        </Shelf>
        <CardPortfolioValue address={centAddress} />
      </LayoutSection>
      <LayoutSection title="Holdings" pt={12} pb={12}>
        <Holdings address={centAddress} showActions={false} />
      </LayoutSection>
      <LayoutSection title="Transaction history" pt={12} pb={12}>
        <Transactions onlyMostRecent address={centAddress} />
      </LayoutSection>
      <Resolutions dao={dao} />
    </>
  ) : null
}
