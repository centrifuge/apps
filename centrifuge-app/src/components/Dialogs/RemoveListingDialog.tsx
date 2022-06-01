import { Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useBalance } from '../../utils/useBalance'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useNFT } from '../../utils/useNFTs'
import { ButtonGroup } from '../ButtonGroup'
import { useCentrifuge } from '../CentrifugeProvider'
import { useWeb3 } from '../Web3Provider'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 0.1

export const RemoveListingDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const { selectedAccount } = useWeb3()
  const balance = useBalance()
  const centrifuge = useCentrifuge()
  const nft = useNFT(collectionId, nftId)

  const isConnected = !!selectedAccount?.address

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Remove NFT listing', (cent) => cent.nfts.removeNftListing)

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected) return

    doTransaction([collectionId, nftId])
  }

  function reset() {
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  const balanceLow = !balance || balance < TRANSFER_FEE_ESTIMATE

  const disabled = balanceLow

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Are you sure about removing this listing?
          </Text>
          <Stack>
            <Shelf gap={1} alignItems="baseline">
              <Text variant="heading1" fontWeight={400}>
                {nft?.sellPrice && centrifuge.utils.formatCurrencyAmount(nft.sellPrice, 'AIR')}
              </Text>
            </Shelf>
          </Stack>
          <Shelf justifyContent="space-between">
            {balanceLow && (
              <Text variant="label1" color="criticalForeground">
                Your balance is too low ({(balance || 0).toFixed(2)} AIR)
              </Text>
            )}
            <ButtonGroup ml="auto">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled} loading={transactionIsPending}>
                Remove listing
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
