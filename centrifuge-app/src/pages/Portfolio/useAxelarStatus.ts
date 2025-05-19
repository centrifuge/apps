import { useEffect } from 'react'
import { isTestEnv } from '../../../src/config'

const intervalMs = 30_000

// it fetches the status of the Axelar transaction every 30 seconds
// it will fallback to the onSuccess callback after 20 minutes if the transaction is not completed

export function useAxelarStatusPoller({ isActive, onSuccess }: { isActive: boolean; onSuccess: () => void }) {
  useEffect(() => {
    if (!isActive) return

    let interval: any
    let timeout: any
    let completed = false

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
            completed = true
            localStorage.removeItem('axelarHash')
            onSuccess()
            clearInterval(interval)
            clearTimeout(timeout)
          }
        } catch (err) {
          console.error('Error polling Axelar tx status:', err)
        }
      }, intervalMs)

      timeout = setTimeout(() => {
        if (!completed) {
          onSuccess()
          clearInterval(interval)
        }
      }, 20 * 60 * 1000)
    }

    startPolling()

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isActive, onSuccess])
}
