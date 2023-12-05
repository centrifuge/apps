import * as React from 'react'
import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function TransactionHistoryPage() {
  const { address: addressParam } = useParams<{ address: string }>()
  const connectedAddress = useAddress()
  const address = addressParam || connectedAddress
  return (
    <LayoutBase>
      <BasePadding>{address ? <Transactions address={address} /> : null}</BasePadding>
    </LayoutBase>
  )
}
