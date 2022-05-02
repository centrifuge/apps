import { Dialog, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestRedeem } from '../InvestRedeem'

export const InvestRedeemDialog: React.FC<{
  poolId: string
  trancheId: number
  open: boolean
  onClose: () => void
  action?: 'invest' | 'redeem'
  showTabs?: boolean
}> = ({ poolId, trancheId, open, onClose, action, showTabs }) => {
  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          {action === 'invest' ? 'Invest' : 'Redeem'}
        </Text>
        <InvestRedeem poolId={poolId} trancheId={trancheId} action={action} showTabs={showTabs} />
      </Stack>
    </Dialog>
  )
}
