import Centrifuge, { CurrencyBalance, Perquintill, Rate } from '@centrifuge/centrifuge-js'
import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import * as React from 'react'
import { combineLatest, map, of, Subject, switchMap } from 'rxjs'
import { config } from '../config'

type CreatePoolArgs = Parameters<Centrifuge['pools']['createPool']>[0]

export function useProposalEstimate(formValues: Pick<PoolMetadataInput, 'tranches' | 'currency' | 'maxReserve'>) {
  const [proposeFee, setProposeFee] = React.useState<CurrencyBalance | null>(null)
  const [chainDecimals, setChainDecimals] = React.useState(18)
  const { selectedAccount } = useWallet()
  const centrifuge = useCentrifuge()

  // Retrieve the submittable with data currently in the form to see how much the transaction would cost
  // Only for when the pool creation goes via democracy
  const [$proposeFee, feeSubject] = React.useMemo(() => {
    const subject = new Subject<CreatePoolArgs>()
    const $fee = subject.pipe(
      switchMap((args) => {
        if (!selectedAccount) return of(null)
        const connectedCent = centrifuge.connect(selectedAccount?.address, selectedAccount?.signer as any)
        return combineLatest([
          centrifuge.getApi(),
          connectedCent.pools.createPool(args, {
            batch: true,
            paymentInfo: selectedAccount.address,
            createType: config.poolCreationType,
          }),
        ]).pipe(
          map(([api, submittable]) => {
            const { minimumDeposit, preimageByteDeposit } = api.consts.democracy
            setChainDecimals(api.registry.chainDecimals[0])
            // We need the first argument passed to the `notePreimage` extrinsic, which is the actual encoded proposal
            const notePreimageDeposit = hexToBN(preimageByteDeposit.toHex()).mul(
              config.poolCreationType === 'notePreimage'
                ? new BN((submittable as any).method.args[0].length)
                : new BN((submittable as any).method.args[0][0].args[0].length)
            )
            const feeBN =
              config.poolCreationType === 'notePreimage'
                ? notePreimageDeposit
                : notePreimageDeposit.add(hexToBN(minimumDeposit.toHex()))
            return new CurrencyBalance(feeBN, chainDecimals)
          })
        )
      })
    )
    return [$fee, subject] as const
  }, [centrifuge, selectedAccount, chainDecimals])

  React.useEffect(() => {
    const sub = $proposeFee.subscribe({
      next: (val) => {
        setProposeFee(val)
      },
    })
    return () => {
      sub.unsubscribe()
    }
  }, [$proposeFee])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getProposeFee = React.useCallback(
    debounce((values: Pick<PoolMetadataInput, 'tranches' | 'currency' | 'maxReserve'>) => {
      if (!selectedAccount) return

      const noJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {},
        ...noJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate || 0),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer || 0),
        })),
      ]

      const currency = values.currency === 'PermissionedEur' ? { permissioned: 'PermissionedEur' } : values.currency

      // Complete the data in the form with some dummy data for things like poolId and metadata
      feeSubject.next([
        selectedAccount.address,
        '1234567890',
        '1234567890',
        tranches,
        currency,
        CurrencyBalance.fromFloat(values.maxReserve || 0, chainDecimals),
        {} as any,
      ] as CreatePoolArgs)
    }, 1000),
    []
  )

  React.useEffect(() => {
    if (config.poolCreationType !== 'immediate') {
      getProposeFee(formValues)
    }
  }, [formValues, getProposeFee])

  return {
    proposeFee,
  }
}

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

function debounce<T extends Function>(cb: T, wait = 20) {
  let h: any
  function callable(...args: any) {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return callable as any as T
}
