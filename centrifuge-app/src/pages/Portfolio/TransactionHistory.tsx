import { useParams } from 'react-router'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function TransactionHistoryPage() {
  const { address: addressParam } = useParams<{ address: string }>()
  const connectedAddress = useAddress()
  const address = addressParam || connectedAddress
  return (
    <LayoutSection title="Transaction history" marginTop={40}>
      {address && <Transactions address={address} />}
    </LayoutSection>
  )
}
