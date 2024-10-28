import Centrifuge from '@centrifuge/centrifuge-sdk'
import { useEffect, useState } from 'react'

function App() {
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    const fetchBalance = async () => {
      const centrifuge = new Centrifuge({
        environment: 'demo',
      })

      const address = '0x423420Ae467df6e90291fd0252c0A8a637C1e03f'
      const chainId = 11155111

      try {
        const accountQuery = centrifuge.account(address, chainId)

        accountQuery.subscribe({
          next: (account) => {
            account.balances().subscribe({
              next: (balanceValue) => {
                console.log('Account Balance:', balanceValue)
                setBalance(balanceValue.toString())
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
  }, [])

  return (
    <div>
      <h1>Account Balance</h1>
      {balance ? <p>{balance} TUSD</p> : <p>Loading balance...</p>}
    </div>
  )
}

export default App
