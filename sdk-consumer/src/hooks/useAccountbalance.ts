import Centrifuge from '@centrifuge/centrifuge-sdk'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

type Balance = bigint | null

export function useAccountBalance(): Balance {
  const { address, chain } = useAccount()
  const [balance, setBalance] = useState<Balance>(null)

  // const addressNumber = '0x423420Ae467df6e90291fd0252c0A8a637C1e03f'
  const chainId = 11155111

  useEffect(() => {
    if (!address) return

    const fetchBalance = async () => {
      const centrifuge = new Centrifuge({ environment: 'demo' })

      try {
        const accountQuery = centrifuge.account(address, chainId)
        accountQuery.subscribe({
          next: (account) => {
            account.balances().subscribe({
              next: (balanceValue) => {
                setBalance(BigInt(balanceValue))
              },
              error: (error) => console.error('Error fetching balance:', error),
            })
          },
          error: (error) => console.error('Error retrieving account:', error),
        })
      } catch (error) {
        console.error('General Error:', error)
      }
    }

    fetchBalance()
  }, [address, chain])

  return balance
}
