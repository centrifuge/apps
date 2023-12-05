import { Drawer } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestRedeem } from './InvestRedeem'

export function InvestRedeemDrawer({
  poolId,
  trancheId,
  defaultView,
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
  poolId: string
  trancheId: string
  defaultView?: 'invest' | 'redeem'
}) {
  return (
    <Drawer isOpen={open} onClose={onClose}>
      <InvestRedeem poolId={poolId} trancheId={trancheId} defaultView={defaultView} />
    </Drawer>
  )
}
