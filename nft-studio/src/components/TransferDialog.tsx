import { Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useBalance } from '../utils/useBalance'
import { useCreateTransaction } from '../utils/useCreateTransaction'
import { isSameAddress } from '../utils/web3'
import { ButtonGroup } from './ButtonGroup'
import { Dialog } from './Dialog'
import { TextInput } from './TextInput'
import { useWeb3 } from './Web3Provider'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 1

export const TransferDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const [address, setAddress] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const { createTransaction, lastCreatedTransaction, reset: resetLastTransaction } = useCreateTransaction()
  const { data: balance } = useBalance()

  const isConnected = !!selectedAccount?.address

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !!error) return

    createTransaction(
      'Transfer NFT',
      (api: ApiPromise) => api.tx.uniques.transfer(collectionId, nftId, address),
      () => {
        queryClient.invalidateQueries(['nfts', collectionId])
        queryClient.invalidateQueries('balance')
        queryClient.invalidateQueries(['accountNfts'])
        close()
      }
    )
  }

  function reset() {
    setAddress('')
    setTouched(false)
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  function getError() {
    if (!address) return 'No address provided'
    if (!isAddress(address)) return 'Not a valid address'
    if (isSameAddress(address, selectedAccount!.address)) return 'Address is the same as the current owner'
    return null
  }

  const error = getError()

  const balanceLow = !balance || balance < TRANSFER_FEE_ESTIMATE

  const disabled = !!error || balanceLow

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Transfer NFT
          </Text>
          <Text variant="body2">Transfer the NFT ownership</Text>
          <Stack gap={1}>
            <TextInput
              label="Recipient address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            {touched && error && (
              <Text variant="label2" color="criticalForeground">
                {error}
              </Text>
            )}
          </Stack>
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balance || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              <Button variant="outlined" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={disabled}
                loading={
                  lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false
                }
              >
                Transfer
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
