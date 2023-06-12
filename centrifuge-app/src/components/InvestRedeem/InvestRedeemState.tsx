import { useControlledState } from '@centrifuge/fabric'
import * as React from 'react'
import { usePool } from '../../utils/usePools'
import { InvestRedeemInner } from './InvestRedeemInner'
import { InvestRedeemProvider } from './InvestRedeemProvider'
import { InvestRedeemProps } from './types'
import { useAllowedTranches } from './utils'

export function InvestRedeemState(props: InvestRedeemProps) {
  const { poolId, trancheId: trancheIdProp, onSetTrancheId, actionsRef } = props
  const allowedTranches = useAllowedTranches(poolId)
  const pool = usePool(poolId)
  const [view, setView] = React.useState<'start' | 'invest' | 'redeem'>('start')
  const [trancheId, setTrancheId] = useControlledState<string>(pool.tranches.at(-1)!.id, trancheIdProp, onSetTrancheId)

  React.useEffect(() => {
    if (allowedTranches.at(-1)?.id) {
      setTrancheId(allowedTranches.at(-1)!.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedTranches[0]])

  React.useImperativeHandle(actionsRef, () => ({
    setView: (view) => {
      setView(view)
    },
  }))

  function handleSetTrancheId(id: string) {
    setView('start')
    setTrancheId(id)
  }

  return (
    <InvestRedeemProvider poolId={poolId} trancheId={trancheId}>
      <InvestRedeemInner
        {...props}
        trancheId={trancheId}
        view={view}
        setView={setView}
        setTrancheId={handleSetTrancheId}
      />
    </InvestRedeemProvider>
  )
}
