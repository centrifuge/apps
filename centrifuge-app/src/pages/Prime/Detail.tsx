import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { InvestedTokens } from '../../components/Portfolio/InvestedTokens'
import { Transactions } from '../../components/Portfolio/Transactions'
import { RouterTextLink } from '../../components/TextLink'
import { DAOs } from '../../config'

export default function PrimeDetailPage() {
  return (
    <LayoutBase>
      <PrimeDetail />
    </LayoutBase>
  )
}

function PrimeDetail() {
  const { dao: daoSlug } = useParams<{ dao: string }>()
  const dao = DAOs.find((d) => d.slug === daoSlug)
  const utils = useCentrifugeUtils()
  if (!dao) throw new Error('DAO not found')
  const centAddress = utils.formatAddress(
    typeof dao.network === 'number' ? utils.evmToSubstrateAddress(dao.address, dao.network) : dao.address
  )

  console.log('centAddress', centAddress)
  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" alignItems="flex-start" pt={5}>
        <Text variant="body3">
          <Text color="textSecondary">
            <RouterTextLink to="/prime" style={{ textDecoration: 'none' }}>
              Prime
            </RouterTextLink>
          </Text>{' '}
          / {dao.name} DAO Investments
        </Text>
        <Shelf gap={2}>
          <Box as="img" src={dao.icon} alt={dao.name} width="iconRegular" height="iconRegular" borderRadius="50%" />
          <Text variant="heading1">{dao.name} DAO Investments</Text>
        </Shelf>
      </LayoutSection>
      <BasePadding gap={3}>
        <InvestedTokens address={centAddress} />
        <Transactions onlyMostRecent address={centAddress} />
        <AssetAllocation address={centAddress} />
      </BasePadding>
    </>
  )
}
