import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { InvestedTokens } from '../../components/Portfolio/InvestedTokens'
import { Transactions } from '../../components/Portfolio/Transactions'
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
    <BasePadding gap={3}>
      <InvestedTokens address={centAddress} />
      <Transactions onlyMostRecent address={centAddress} />
      <AssetAllocation address={centAddress} />
    </BasePadding>
  )
}
