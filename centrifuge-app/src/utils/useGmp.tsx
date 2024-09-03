import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { IconExternalLink, InlineFeedback, Shelf, Text } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { catchError, from, interval, map, of, switchMap, tap } from 'rxjs'
import { useDebugFlags } from '../components/DebugFlags'

export type Gmp = {
  txHash: string
  gasPaid: boolean
  executed: boolean
} | null

export function useGmp() {
  const { showGmp } = useDebugFlags()
  const { isEvmOnSubstrate } = useWallet()
  const centrifuge = useCentrifuge()
  const isDemo = centrifuge.config.centrifugeWsUrl.includes('k-f.dev')
  const axelarApiUrl = `https://${isDemo ? 'testnet' : ''}.api.axelarscan.io/gmp/searchGMP`
  const axelarScanUrl = `https://${isDemo ? 'testnet' : ''}.axelarscan.io/gmp/`

  const [gmp, setGmp] = useState<Gmp>(() => {
    const storedGmp = sessionStorage.getItem('gmp')
    return storedGmp ? JSON.parse(storedGmp) : null
  })

  useEffect(() => {
    if (gmp) {
      sessionStorage.setItem('gmp', JSON.stringify(gmp))
    } else {
      sessionStorage.removeItem('gmp')
    }
  }, [gmp])

  const setGmpHash = (txHash: string) => {
    setGmp({ txHash, gasPaid: false, executed: false })
  }

  const fetchData = () =>
    from(
      fetch(axelarApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: gmp?.txHash,
        }),
      })
    ).pipe(
      switchMap((res) => res.json()),
      map((data) => data.data),
      catchError((error) => {
        console.error('Error fetching data:', error)
        return of([])
      })
    )

  useQuery(
    ['gmp'],
    () => {
      return new Promise((resolve) => {
        const subscription = interval(5000)
          .pipe(
            switchMap(() => fetchData()),
            tap((data) => {
              if (!gmp) {
                throw new Error('No transaction hash found')
              }
              if (data.length === 0) {
                resolve(null)
                return subscription.unsubscribe()
              }
              if (data.length > 0) {
                const gasPaid = data[0].gas_status === 'gas_paid'
                const executed = data[0].status === 'executed'
                const updatedGmp = { txHash: gmp.txHash, gasPaid, executed }
                if (updatedGmp.gasPaid !== gmp.gasPaid || updatedGmp.executed !== gmp.executed) {
                  setGmp(updatedGmp)
                }
                if (executed) {
                  setGmp(null)
                  subscription.unsubscribe()
                  resolve(data)
                }
              }
            })
          )
          .subscribe()
      })
    },
    {
      enabled: !!gmp && !isEvmOnSubstrate && showGmp,
      refetchInterval: 5000,
    }
  )

  const render = React.useCallback(() => {
    if (gmp && showGmp) {
      return (
        <Shelf p={1} backgroundColor="statusWarningBg" borderRadius={1} gap={1} alignItems="center">
          <InlineFeedback>
            {!gmp.executed ? (
              <Shelf gap={1}>
                <Text variant="body2">{gmp.gasPaid ? 'Gas paid, finalizing' : 'Awaiting gas payment'} </Text>
                <Shelf
                  as="a"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                  href={`${axelarScanUrl}${gmp.txHash}`}
                  target="_blank"
                >
                  <Text variant="body2">on Axelar</Text>
                  <IconExternalLink size="iconSmall" />
                </Shelf>
              </Shelf>
            ) : (
              <Shelf gap={1}>
                <Text variant="body2">Transaction executed on </Text>
                <Shelf
                  as="a"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                  href={`${axelarScanUrl}${gmp.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Text variant="body2">Axelar</Text>
                  <IconExternalLink size="iconSmall" />
                </Shelf>
              </Shelf>
            )}
          </InlineFeedback>
        </Shelf>
      )
    } else {
      return null
    }
  }, [gmp, showGmp])

  return { setGmpHash, render, gmpHash: gmp?.txHash }
}
