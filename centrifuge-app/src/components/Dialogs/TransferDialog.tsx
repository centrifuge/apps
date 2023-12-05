import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Dialog, Shelf, Stack, Text, TextInput_DEPRECATED } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { isSameAddress } from '../../utils/web3'
import { ButtonGroup } from '../ButtonGroup'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 0.1

export const TransferDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const [address, setAddress] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const connectedAddress = useAddress('substrate')
  const balances = useBalances(connectedAddress)

  const isConnected = !!connectedAddress

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Transfer NFT', (cent) => cent.nfts.transferNft)

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !!error) return

    doTransaction([collectionId, nftId, address])
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
    if (isSameAddress(address, connectedAddress)) return 'Address is the same as the current owner'
    return undefined
  }

  const error = getError()

  const balanceDec = balances?.native.balance.toDecimal() ?? Dec(0)
  const balanceLow = balanceDec.lt(TRANSFER_FEE_ESTIMATE)

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
            <TextInput_DEPRECATED
              label="Recipient address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setTouched(true)}
              errorMessage={touched ? error : undefined}
            />
          </Stack>
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balanceDec || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled} loading={transactionIsPending}>
                Transfer
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
