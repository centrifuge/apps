import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { Dec } from '../utils/Decimal'
import { useAddress } from '../utils/useAddress'
import { useBalance } from '../utils/useBalance'
import { useNFT } from '../utils/useNFTs'
import { ButtonGroup } from './ButtonGroup'

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 0.1

export const BuyDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const address = useAddress()
  const balance = useBalance()
  const nft = useNFT(collectionId, nftId)

  const isConnected = !!address

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Buy NFT', (cent) => cent.nfts.buyNft)

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !nft || nft.sellPrice === null) return

    doTransaction([collectionId, nftId, new BN(nft.sellPrice)])
  }

  function reset() {
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  const priceDec = Dec(nft?.sellPrice ?? 0).div('1e18')
  const balanceDec = Dec(balance ?? 0)

  const balanceLow = balanceDec.lt(priceDec.add(Dec(TRANSFER_FEE_ESTIMATE)))

  const disabled = balanceLow || !nft

  function getMessage() {
    if (balance == null) return
    if (balanceDec.lt(priceDec)) return 'Insufficient funds to purchase this NFT'
    if (balanceLow) return 'Insufficient funds to pay for transaction costs'
  }

  const message = getMessage()

  return (
    <Dialog isOpen={open} onClose={close}>
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Text variant="heading2" as="h2">
            Buy NFT
          </Text>
          <Stack>
            <Shelf gap={1} alignItems="baseline">
              <Stack>
                <Text variant="heading1" fontWeight={400}>
                  {nft?.sellPrice && `${formatPrice(priceDec.toNumber())} AIR`}
                </Text>
                {balance != null && <Text variant="label2">{formatPrice(balance)} AIR balance</Text>}
              </Stack>
            </Shelf>
          </Stack>
          <Shelf justifyContent="space-between">
            {message && <Text variant="label2">{message}</Text>}
            <ButtonGroup ml="auto">
              <Button variant="secondary" onClick={close}>
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

function formatPrice(number: number) {
  return number.toLocaleString('en', { maximumSignificantDigits: 2 })
}
