import { Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { usePool } from '../utils/usePools'
import { FaucetConfirmationDialog } from './Dialogs/FaucetConfirmationDialog'
import { useWeb3 } from './Web3Provider'

export const Faucet: React.VFC = () => {
  const { selectedAccount } = useWeb3()
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const [hash, setHash] = React.useState<string>('')
  const [claimError, setClaimError] = React.useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClaim = async () => {
    setIsLoading(true)
    const response = await fetch(`${import.meta.env.REACT_APP_FAUCET_URL}?address=${selectedAccount?.address}`)
    if (response.status === 408) {
      setIsLoading(false)
    }
    if (response.status !== 200) {
      setIsDialogOpen(true)
      setIsLoading(false)
      setClaimError(await response.text())
      return
    }
    const data = await response.json()
    if (data?.hash) {
      setHash('')
      setIsDialogOpen(true)
      setIsLoading(false)
    }
    setClaimError('Something went wrong')
    setIsLoading(false)
  }

  return pool ? (
    <>
      <FaucetConfirmationDialog
        error={claimError}
        hash={hash}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setHash('')
          setClaimError('')
        }}
      />
      <Shelf as={Card} gap={2} p={2} justifyContent="space-between">
        <Stack gap="4px">
          <Text variant="body2">Faucet</Text>
          <Text variant="heading3">1k DEVEL and 10k aUSD</Text>
        </Stack>
        <Button loading={isLoading} disabled={isLoading} onClick={handleClaim} variant="primary">
          Claim
        </Button>
      </Shelf>
    </>
  ) : null
}
