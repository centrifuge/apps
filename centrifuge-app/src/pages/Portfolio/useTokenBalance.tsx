import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BrowserProvider, ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { Decimal } from '../../utils/Decimal'

// Replace with your contract address
const CONTRACT_ADDRESS = '0x657a4556e60A6097975e2E6dDFbb399E5ee9a58b'

// Minimal ABI for ERC20 balanceOf function
const ABI = ['function balanceOf(address owner) view returns (uint256)']

export const useTokenBalance = (userAddress: string | undefined) => {
  const [balance, setBalance] = useState<Decimal | null>(null)
  const [error, setError] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (!userAddress) return

    const fetchBalance = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum)

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
        const rawBalance = await contract.balanceOf(userAddress)
        const balance = new CurrencyBalance(rawBalance.toString(), 18).toDecimal()
        setBalance(balance)
      } catch (err) {
        console.error(err)
        setError(err)
      }
    }

    fetchBalance()
    setLoading(false)
  }, [userAddress])

  return { balance, error, loading }
}
