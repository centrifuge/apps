import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { Holdings } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { Resolutions } from '../../components/Resolutions'
import { RouterTextLink } from '../../components/TextLink'
import { useGetDAOConfig } from '../../utils/useDAOConfig'

export default function PrimeDetailPage() {
  return (
    <LayoutBase>
      <PrimeDetail />
    </LayoutBase>
  )
}

function PrimeDetail() {
  const { dao: daoSlug } = useParams<{ dao: string }>()
  const { data: DAOs, isLoading } = useGetDAOConfig()
  const dao = DAOs?.find((d) => d.slug === daoSlug)
  const utils = useCentrifugeUtils()
  const centAddress =
    dao &&
    utils.formatAddress(
      typeof dao.network === 'number' ? utils.evmToSubstrateAddress(dao.address, dao.network) : dao.address
    )

  return !isLoading && dao && centAddress ? (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" alignItems="flex-start" pt={5}>
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
      </LayoutSection>
      <BasePadding gap={3}>
        <Holdings address={centAddress} />
        <Transactions onlyMostRecent address={centAddress} />
        <Resolutions dao={dao} />
      </BasePadding>
    </>
  ) : null
}
