import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import Transactions from '../../components/Portfolio/Transactions'

export default function TransactionHistoryPage() {
  return (
    <LayoutBase>
      <BasePadding>
        <Stack as="article" gap={4}>
          <Text as="h2" variant="heading2">
            Transaction history
          </Text>
          <Transactions />
        </Stack>
      </BasePadding>
    </LayoutBase>
  )
}
