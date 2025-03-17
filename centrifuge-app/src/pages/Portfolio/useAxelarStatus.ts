import { useEffect } from 'react'
import { isTestEnv } from '../../../src/config'

const intervalMs = 60_000

export function useAxelarStatusPoller({ isActive, onSuccess }: { isActive: boolean; onSuccess: () => void }) {
  useEffect(() => {
    if (!isActive) return

    let interval: NodeJS.Timeout

    const startPolling = async () => {
      const { AxelarGMPRecoveryAPI, Environment } = await import('@axelar-network/axelarjs-sdk')
      const axelarRecoveryApi = new AxelarGMPRecoveryAPI({
        environment: isTestEnv ? Environment.TESTNET : Environment.MAINNET,
      })

      interval = setInterval(async () => {
        const txHash = localStorage.getItem('axelarHash')
        if (!txHash) return

        try {
          const response = await axelarRecoveryApi.queryTransactionStatus(txHash)

          if (response.status === 'destination_executed') {
            localStorage.removeItem('axelarHash')
            onSuccess()
            clearInterval(interval)
          }
        } catch (err) {
          console.error('Error polling Axelar tx status:', err)
        }
      }, intervalMs)
    }

    startPolling()

    return () => clearInterval(interval)
  }, [isActive, onSuccess])
}
