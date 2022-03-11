import { Button, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useQueryClient } from 'react-query'
import { useBalance } from '../utils/useBalance'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { ButtonGroup } from './ButtonGroup'
import { Dialog } from './Dialog'
import { useWeb3 } from './Web3Provider'

const e18 = new BN(10).pow(new BN(18))

type Props = {
  open: boolean
  onClose: () => void
  collectionId: string
  nftId: string
}
// TODO: replace with better fee estimate
const TRANSFER_FEE_ESTIMATE = 0.1

export const SellDialog: React.FC<Props> = ({ open, onClose, collectionId, nftId }) => {
  const [price, setPrice] = React.useState<string | number>('')
  const [touched, setTouched] = React.useState(false)
  const queryClient = useQueryClient()
  const { selectedAccount } = useWeb3()
  const { data: balance } = useBalance()

  const isConnected = !!selectedAccount?.address

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
  } = useCentrifugeTransaction('List NFT for sale', (cent) => cent.nfts.sellNft, {
    onSuccess: () => {
      queryClient.invalidateQueries(['nfts', collectionId])
      close()
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isConnected || !!error) return

    const amountBN = new BN(price).mul(e18)
    doTransaction([collectionId, nftId, amountBN])
  }

  function reset() {
    setPrice('')
    setTouched(false)
    resetLastTransaction()
  }

  function close() {
    reset()
    onClose()
  }

  function getError() {
    if (!price && price !== 0) return 'Invalid price'
    if (price < 0) return "Price can't be negative"
    if (price > Number.MAX_SAFE_INTEGER) return 'Price too high'
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
            Sell NFT
          </Text>
          <Text variant="body2">Enter item price</Text>
          <CurrencyInput
            label="Price"
            value={price}
            min="0"
            onChange={(e) => setPrice(e.target.value)}
            errorMessage={(touched && error) || undefined}
            onBlur={() => setTouched(true)}
            currency="AIR"
          />
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
                Put on sale
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
