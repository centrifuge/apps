import { Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { FaucetConfirmationDialog } from './Dialogs/FaucetConfirmationDialog'
import { useWeb3 } from './Web3Provider'

export const Faucet: React.VFC = () => {
  const { selectedAccount } = useWeb3()
  const [hash, setHash] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.REACT_APP_FAUCET_URL}?address=${selectedAccount?.address}`)
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

  return (
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
          <Text variant="body2">Faucet</Text>
          <Text variant="heading3">1k DEVEL and 10k aUSD</Text>
        </Stack>
        <Button loading={isLoading} disabled={isLoading} onClick={handleClaim} variant="primary">
          Claim
        </Button>
      </Shelf>
    </>
  )
}
