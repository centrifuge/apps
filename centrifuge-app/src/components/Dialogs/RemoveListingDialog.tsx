import { useBalances, useCentrifuge, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { useNFT } from '../../utils/useNFTs'
import { ButtonGroup } from '../ButtonGroup'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 0.1

export const RemoveListingDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const { substrate } = useWallet()
  const address = useAddress('substrate')
  const balances = useBalances(address)
  const centrifuge = useCentrifuge()
  const nft = useNFT(collectionId, nftId)

  const isConnected = !!substrate.selectedAccount?.address

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

  const balanceDec = balances?.native.balance.toDecimal() ?? Dec(0)
  const balanceLow = balanceDec.lt(TRANSFER_FEE_ESTIMATE)

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
                Your balance is too low ({(balanceDec || 0).toFixed(2)} AIR)
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
