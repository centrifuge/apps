import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { usePool } from '../utils/usePools'
import { FaucetConfirmationDialog } from './Dialogs/FaucetConfirmationDialog'
import { useWeb3 } from './Web3Provider'

export const Faucet: React.VFC = () => {
  const { selectedAccount } = useWeb3()
  const balances = useBalances(useAddress())
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const [hash, setHash] = React.useState()
  const [claimError, setClaimError] = React.useState()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleClaim = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setHash(undefined)
    setClaimError(undefined)
    e.preventDefault()

    const ipRes = await fetch(`https://api.ipify.org?format=json`)
    const ipData = await ipRes.json()

    const claimResponse = await fetch(
      `${import.meta.env.REACT_APP_FAUCET_URL}?address=${selectedAccount?.address}&ip=${ipData.ip}`
    )
    const claim = await claimResponse.json()
    if (claim?.hash) {
      setHash(claim.hash)
    }
    if (claim?.error) {
      setClaimError(claim.error)
    }
    setIsDialogOpen(true)
  }

  return pool &&
    balances &&
    new CurrencyBalance(balances.native.balance, 18).toDecimal().lte(10) &&
    balances.currencies.map((curr) => new CurrencyBalance(curr.balance, curr.currencyDecimals).toDecimal().lte(100)) ? (
    <>
      <FaucetConfirmationDialog
        error={claimError}
        hash={hash || ''}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <Shelf as={Card} gap={2} p={2} justifyContent="space-between">
        <Stack gap="4px">
          <Text variant="body2">Faucet</Text>
          <Text variant="heading3">1k DEVEL and 10k aUSD</Text>
        </Stack>
        <Button onClick={handleClaim} variant="primary">
          Claim
        </Button>
      </Shelf>
    </>
  ) : null
}
