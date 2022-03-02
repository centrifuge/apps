import { Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useNFT } from '../utils/useNFTs'
import { ButtonGroup } from './ButtonGroup'
import { useCentrifuge } from './CentrifugeProvider'
import { Dialog } from './Dialog'
import { useWeb3 } from './Web3Provider'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 1

export const BuyDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const { data: balance } = useBalance()
  const centrifuge = useCentrifuge()
  const nft = useNFT(collectionId, nftId)

  const isConnected = !!selectedAccount?.address

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('Buy NFT', (cent) => cent.nfts.buyNft, {
    onSuccess: () => {
      queryClient.invalidateQueries(['nfts', collectionId])
      close()
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !nft || nft.sellPrice === null) return

    doTransaction([collectionId, nftId, nft.sellPrice])
  }

  function reset() {
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  const balanceLow = !balance || balance < TRANSFER_FEE_ESTIMATE

  const disabled = balanceLow || !nft

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Buy NFT
          </Text>
          <Stack>
            <Shelf gap={1} alignItems="baseline">
              <Text variant="heading3">
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
              <Button variant="outlined" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled} loading={transactionIsPending}>
                Buy NFT
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
