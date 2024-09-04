import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { IconExternalLink, InlineFeedback, Shelf, Text } from '@centrifuge/fabric'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { useDebugFlags } from '../components/DebugFlags'

export type Gmp = {
  txHash: string
  gasPaid: boolean | undefined
  executed: boolean | undefined
  poolId: string
  trancheId: string
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

  const setGmpHash = (txHash: string, poolId: string, trancheId: string) => {
    setGmp({ txHash, gasPaid: undefined, executed: undefined, poolId, trancheId })
  }

  async function fetchData() {
    try {
      const response = await fetch(axelarApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: gmp?.txHash }),
      })
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }

  useQuery(
    ['gmp'],
    async () => {
      if (!gmp) throw new Error('No transaction hash found')

      const data = await fetchData()

      if (data.length === 0) return null

      const gasPaid = data[0].gas_status === 'gas_paid'
      const executed = data[0].status === 'executed'
      const updatedGmp = { ...gmp, txHash: gmp.txHash, gasPaid, executed }

      if (updatedGmp.gasPaid !== gmp.gasPaid || updatedGmp.executed !== gmp.executed) {
        setGmp(updatedGmp)
      }

      if (executed) {
        setGmp(null)
      }

      return data
    },
    {
      enabled: !!gmp && !isEvmOnSubstrate && showGmp,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  )

  const render = React.useCallback(
    (poolId: string, trancheId: string) => {
      if (gmp && showGmp && gmp.poolId === poolId && gmp.trancheId === trancheId) {
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
    },
    [gmp, showGmp]
  )

  return { setGmpHash, render, gmpHash: gmp?.txHash }
}
