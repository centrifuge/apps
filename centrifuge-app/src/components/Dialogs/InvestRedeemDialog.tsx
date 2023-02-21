import { Dialog, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestRedeem } from '../InvestRedeem/InvestRedeem'

export const InvestRedeemDialog: React.FC<{
  poolId: string
  trancheId: string
  open: boolean
  onClose: () => void
  view?: 'invest' | 'redeem'
}> = ({ poolId, trancheId, open, onClose, view }) => {
  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          {view === 'invest' ? 'Invest' : 'Redeem'}
        </Text>
        <InvestRedeem poolId={poolId} trancheId={trancheId} view={view} />
      </Stack>
    </Dialog>
  )
}
