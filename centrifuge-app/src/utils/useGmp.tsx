import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { IconExternalLink, InlineFeedback, Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import { useQuery } from 'react-query'
import { useDebugFlags } from '../components/DebugFlags'

export type Gmp = {
  txHash: string
  poolId: string
  trancheId: string
  address: string
} | null

export function useGmp() {
  const { showGmp } = useDebugFlags()
  const {
    isEvmOnSubstrate,
    evm: { selectedAddress },
  } = useWallet()
  const centrifuge = useCentrifuge()
  const isDemo = centrifuge.config.centrifugeWsUrl.includes('k-f.dev')
  const axelarApiUrl = `https://${isDemo ? 'testnet' : ''}.api.axelarscan.io/gmp/searchGMP`
  const axelarScanUrl = `https://${isDemo ? 'testnet' : ''}.axelarscan.io/gmp/`

  const [gmp, setGmp] = React.useState<Gmp | null>(null)

  const setGmpHash = (txHash: string, poolId: string, trancheId: string, address: string) => {
    const gmp = { txHash, poolId, trancheId, address }
    sessionStorage.setItem('gmp', JSON.stringify(gmp))
    setGmp(gmp)
  }

  React.useEffect(() => {
    if (!gmp) {
      const storedGmp = sessionStorage.getItem('gmp')
      if (storedGmp) {
        setGmp(JSON.parse(storedGmp))
      }
    }

    if (executed) {
      return () => {
        sessionStorage.removeItem('gmp')
      }
    }
  }, [gmp])

  async function fetchData(txHash: string) {
    try {
      const response = await fetch(axelarApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash }),
      })
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }

  const { data } = useQuery(
    ['gmp', gmp?.txHash],
    async () => {
      if (!gmp?.txHash) throw new Error('No transaction hash found')
      const data = await fetchData(gmp.txHash)
      return data
    },
    {
      enabled: !!gmp && !isEvmOnSubstrate && showGmp,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  )

  const gasPaid = !!data?.[0]?.gas_paid
  const executed = !!data?.[0]?.executed

  const render = React.useCallback(
    (poolId: string, trancheId: string) => {
      if (gmp && showGmp && gmp.poolId === poolId && gmp.trancheId === trancheId && gmp.address === selectedAddress) {
        return (
          <Shelf p={1} mb={2} backgroundColor="statusWarningBg" borderRadius={1} gap={1} alignItems="center">
            <InlineFeedback>
              {!executed ? (
                <Shelf gap={1}>
                  <Text variant="body2">{gasPaid ? 'Gas paid, finalizing' : 'Awaiting gas payment'} </Text>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gasPaid, executed]
  )

  return { setGmpHash, render, gmpHash: gmp?.txHash }
}
