import Centrifuge, { CurrencyBalance, Perquintill, PoolMetadataInput, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeConsts, useWallet } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import * as React from 'react'
import { Subject, combineLatest, map, of, switchMap } from 'rxjs'
import { config } from '../config'
import { useCurrencies } from './useCurrencies'

const mockMetadata = {
  poolIcon: '0x',
  poolName: 'More Pool Poolios',
  assetClass: 'Corporate Credit',
  maxReserve: 1,
  epochHours: 23,
  epochMinutes: 50,
  podEndpoint: 'https://google.com',
  listed: true,
  issuerName: 'Polka Issuer',
  issuerLogo: '0x',
  issuerDescription: '',
  executiveSummary: '',
  website: '',
  forum: '',
  email: 'user@k-f.co',
  details: [],
}

type CreatePoolArgs = Parameters<Centrifuge['pools']['createPool']>[0]

export function useCreatePoolFee(formValues: Pick<PoolMetadataInput, 'tranches' | 'maxReserve'>) {
  const [proposeFee, setProposeFee] = React.useState<CurrencyBalance | null>(null)
  const [paymentInfo, setPaymentInfo] = React.useState<{ weight: number; partialFee: CurrencyBalance } | null>(null)
  const {
    chainDecimals,
    poolSystem: { poolDeposit },
    proxy: { proxyDepositBase, proxyDepositFactor },
    uniques: { collectionDeposit },
  } = useCentrifugeConsts()
  const { selectedAccount } = useWallet().substrate
  const centrifuge = useCentrifuge()
  const currencies = useCurrencies()

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
          connectedCent.pools.createPool(args, {
            paymentInfo: selectedAccount.address,
            createType: config.poolCreationType,
          }),
        ]).pipe(
          map(([api, submittable, paymentInfo]) => {
            const { minimumDeposit } = api.consts.democracy
            if (config.poolCreationType === 'notePreimage') {
              // hard coded base and byte deposit supplied by protocol
              const preimageBaseDeposit = new CurrencyBalance('4140000000000000000', chainDecimals)
              const preimageByteDeposit = new CurrencyBalance('60000000000000000', chainDecimals)
              const preimageFee = preimageByteDeposit
                // the first argument passed to the `notePreimage` extrinsic is the actual encoded proposal in bytes
                .mul(new BN((submittable as any).method.args[0].length))
                .add(preimageBaseDeposit)
              return [new CurrencyBalance(preimageFee, chainDecimals), paymentInfo]
            } else if (config.poolCreationType === 'propose') {
              return [new CurrencyBalance(hexToBN(minimumDeposit.toHex()), chainDecimals), paymentInfo]
            }
            return [new CurrencyBalance(0, chainDecimals), paymentInfo]
          })
        )
      })
    )
    return [$fee, subject] as const
  }, [centrifuge, selectedAccount, chainDecimals])

  React.useEffect(() => {
    const sub = $proposeFee.subscribe({
      next: (val) => {
        setProposeFee(val?.[0] as any)
        setPaymentInfo(val?.[1] as any)
      },
      error: (error) => {
        console.error('getProposeFee error', error)
      },
    })
    return () => {
      sub.unsubscribe()
    }
  }, [$proposeFee])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getProposeFee = React.useCallback(
    debounce((values: Pick<PoolMetadataInput, 'tranches' | 'maxReserve'>) => {
      if (!selectedAccount || !currencies) return

      const noJuniorTranches = values.tranches.slice(1)
      const tranches = [
        {},
        ...noJuniorTranches.map((tranche) => ({
          interestRatePerSec: Rate.fromAprPercent(tranche.interestRate || 0),
          minRiskBuffer: Perquintill.fromPercent(tranche.minRiskBuffer || 0),
        })),
      ]

      // Complete the data in the form with some dummy data for things like poolId and metadata
      feeSubject.next([
        selectedAccount.address,
        '1234567890',
        tranches,
        currencies[0].key,
        CurrencyBalance.fromFloat(values.maxReserve || 0, chainDecimals),
        { ...mockMetadata, tranches } as any,
        [],
      ] as CreatePoolArgs)
    }, 1000),
    []
  )

  React.useEffect(() => {
    getProposeFee(formValues)
  }, [formValues, getProposeFee])

  return {
    proposeFee,
    paymentInfo,
    poolDeposit,
    collectionDeposit,
    proxyDeposit: new CurrencyBalance(
      proxyDepositBase.add(proxyDepositFactor.mul(new BN(2))).mul(new BN(2)),
      proxyDepositBase.decimals
    ),
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
