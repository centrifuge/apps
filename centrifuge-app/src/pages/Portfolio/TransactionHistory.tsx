import * as React from 'react'
import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function TransactionHistoryPage() {
  const { address: addressParam } = useParams<{ address: string }>()
  const connectedAddress = useAddress()
  const address = addressParam || connectedAddress
  return (
    <LayoutBase>
      <LayoutSection title="Transaction history" pt={5}>
        {address && <Transactions address={address} />}
      </LayoutSection>
    </LayoutBase>
  )
}
