import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BrowserProvider, ethers } from 'ethers'
import { useQuery } from 'react-query'
import { Decimal } from '../../../src/utils/Decimal'

// Replace with your contract address
const CONTRACT_ADDRESS = '0x657a4556e60A6097975e2E6dDFbb399E5ee9a58b'

// Minimal ABI for ERC20 balanceOf function
const ABI = ['function balanceOf(address owner) view returns (uint256)']

export const useTokenBalance = (userAddress: string | undefined) => {
  const {
    data: balance,
    error,
    isLoading,
  } = useQuery<Decimal, unknown>(
    ['tokenBalance', userAddress],
    async () => {
      const provider = new BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
      const rawBalance = await contract.balanceOf(userAddress!)
      return new CurrencyBalance(rawBalance.toString(), 18).toDecimal()
    },
    {
      enabled: !!userAddress,
    }
  )

  return { balance: balance ?? null, error, loading: isLoading }
}
