import { CurrencyBalance, findCurrency } from '@centrifuge/centrifuge-js'
import { useAddress, useBalances, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { useCurrencies } from '../utils/useCurrencies'
import { usePool } from '../utils/usePools'
import { FaucetConfirmationDialog } from './Dialogs/FaucetConfirmationDialog'

const MIN_DEVEL_BALANCE = 10
const MIN_POOL_CURRENCY_BALANCE = 100

export const Faucet = () => {
  const { selectedAccount } = useWallet().substrate
  const [hash, setHash] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const currencies = useCurrencies()
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const balances = useBalances(useAddress('substrate'))

  const { connectedType } = useWallet()
  const isTinlakePool = poolId?.startsWith('0x')

  const hasLowNativeBalance =
    balances && new CurrencyBalance(balances.native.balance, 18).toDecimal().lte(MIN_DEVEL_BALANCE)
  const poolCurrency = findCurrency(currencies ?? [], pool?.currency?.key)
  const poolCurrencyBalance =
    balances?.currencies.find((curr) => curr.currency.symbol === poolCurrency?.symbol)?.balance ?? new BN(0)
  const hasLowPoolCurrencyBalance =
    (poolCurrency &&
      new CurrencyBalance(poolCurrencyBalance, poolCurrency.decimals).toDecimal().lte(MIN_POOL_CURRENCY_BALANCE)) ||
    !poolCurrency

  const shouldRenderFaucet =
    poolCurrency &&
    connectedType === 'substrate' &&
    !isTinlakePool &&
    import.meta.env.REACT_APP_FAUCET_URL &&
    hasLowNativeBalance &&
    hasLowPoolCurrencyBalance

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.REACT_APP_FAUCET_URL}?address=${selectedAccount?.address}&poolId=${pool?.id}`
      )
      if (response.status !== 200) {
        throw response.text()
      }
      const data = (await response.json()) as { hash: string }
      setHash(data?.hash)
    } catch (error: any) {
      setError(error?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return shouldRenderFaucet ? (
    <>
      <FaucetConfirmationDialog
        error={error}
        hash={hash}
        open={!!error || !!hash}
        onClose={() => {
          setHash('')
          setError('')
        }}
      />
      <Shelf as={Card} gap={2} p={2} justifyContent="space-between">
        <Stack gap="4px">
          <Text as="h2" variant="body2">
            Faucet
          </Text>
          <Text as="p" variant="heading3">
            1k {balances.native.currency.symbol} and 10k {pool.currency.symbol}
          </Text>
        </Stack>
        <Button loading={isLoading} disabled={isLoading} onClick={handleClaim} variant="primary">
          Claim
        </Button>
      </Shelf>
    </>
  ) : null
}
