import { Button, Stack, Text } from '@centrifuge/fabric'
import { ApiPromise } from '@polkadot/api'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { useQueryClient } from 'react-query'
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

export const TransferDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const [address, setAddress] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const { createTransaction, lastCreatedTransaction, reset: resetLastTransaction } = useCreateTransaction()

  const isConnected = !!selectedAccount?.address

  function submit() {
    if (!isConnected || !!error) return

    createTransaction('Transfer NFT', (api: ApiPromise) => api.tx.uniques.transfer(collectionId, nftId, address))
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

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'succeeded') {
      queryClient.invalidateQueries(['nfts', collectionId])
      queryClient.invalidateQueries('balance')
      reset()
    }
    // eslint-disable-next-line
  }, [queryClient, lastCreatedTransaction?.status, collectionId])

  function getError() {
    if (!address) return 'No address provided'
    if (!isAddress(address)) return 'Not a valid address'
    if (isSameAddress(address, selectedAccount!.address)) return 'Address is the same as the current owner'
    return null
  }

  const error = getError()

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit} action="">
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
          <ButtonGroup>
            <Button type="reset" variant="outlined" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!!error}
              loading={
                lastCreatedTransaction ? ['unconfirmed', 'pending'].includes(lastCreatedTransaction?.status) : false
              }
            >
              Transfer
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </Dialog>
  )
}
