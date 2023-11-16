import * as React from 'react'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function TransactionHistoryPage() {
  const address = useAddress()
  return (
    <LayoutBase>
      <BasePadding>{address ? <Transactions address={address} /> : null}</BasePadding>
    </LayoutBase>
  )
}
