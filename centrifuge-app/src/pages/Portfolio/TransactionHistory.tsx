import * as React from 'react'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { Transactions } from '../../components/Portfolio/Transactions'

export default function TransactionHistoryPage() {
  return (
    <LayoutBase>
      <BasePadding>
        <Transactions />
      </BasePadding>
    </LayoutBase>
  )
}
