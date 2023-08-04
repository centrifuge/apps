import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { ButtonGroup } from '../ButtonGroup'

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
  const [price, setPrice] = React.useState<number | ''>()
  const [touched, setTouched] = React.useState(false)
  const address = useAddress('substrate')
  const balances = useBalances(address)

  const {
    execute: doTransaction,
    reset: resetLastTransaction,
    isLoading: transactionIsPending,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('List NFT for sale', (cent) => cent.nfts.sellNft)

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!!error) return
    if (!price) return
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

  const balanceDec = balances?.native.balance.toDecimal() ?? Dec(0)
  const balanceLow = balanceDec.lt(TRANSFER_FEE_ESTIMATE)

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
            onChange={(value) => setPrice(value)}
            errorMessage={(touched && error) || undefined}
            onBlur={() => setTouched(true)}
            currency="AIR"
          />
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
                List
              </Button>
            </ButtonGroup>
          </Shelf>
        </Stack>
      </form>
    </Dialog>
  )
}
