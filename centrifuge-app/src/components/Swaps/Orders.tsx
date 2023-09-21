import {
  addressToHex,
  CurrencyBalance,
  CurrencyKey,
  CurrencyMetadata,
  findBalance,
  findCurrency,
  getCurrencyChainId,
  isSameCurrency,
  parseCurrencyKey,
  Rate,
} from '@centrifuge/centrifuge-js'
import {
  truncateAddress,
  useBalances,
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeQuery,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  IconArrowRight,
  IconButton,
  IconCopy,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import * as React from 'react'
import { filter, map, repeatWhen, switchMap } from 'rxjs'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useCurrencies } from '../../utils/useCurrencies'
import { useSuitableAccounts } from '../../utils/usePermissions'
import { ButtonGroup } from '../ButtonGroup'
import { Column, DataTable } from '../DataTable'
import { PageSection } from '../PageSection'

export type OrdersProps = {
  buyOrSell?: CurrencyKey
}

export type SwapOrder = {
  id: string
  account: string
  buyAmount: CurrencyBalance
  sellAmount: CurrencyBalance
  price: Rate
  buyCurrency: CurrencyMetadata
  sellCurrency: CurrencyMetadata
}

export function Orders({ buyOrSell }: OrdersProps) {
  const cent = useCentrifuge()
  const currencies = useCurrencies()
  const utils = useCentrifugeUtils()
  const [selectedOrder, setSelectedOrder] = React.useState<SwapOrder>()

  const columns: Column[] = React.useMemo(
    () => [
      {
        align: 'left',
        header: 'Pair',
        cell: (row: SwapOrder) => `${row.sellCurrency.symbol} <> ${row.buyCurrency.symbol}`,
        flex: '1',
      },
      {
        align: 'left',
        header: 'Amount',
        cell: (row: SwapOrder) => formatBalance(row.buyAmount, row.buyCurrency, 2, 0),
        flex: '1',
      },
      {
        align: 'left',
        header: 'Price',
        cell: (row: SwapOrder) => formatBalance(row.price, row.sellCurrency, 4),
        flex: '1',
      },
      {
        align: 'left',
        header: 'Account',
        cell: (row: SwapOrder) => truncateAddress(utils.formatAddress(row.account)),
        flex: '1',
      },
      {
        align: 'left',
        header: '',
        cell: (row: SwapOrder) => (
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedOrder(row)
            }}
            small
          >
            Fulfill order
          </Button>
        ),
        flex: '1',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [orders] = useCentrifugeQuery(
    ['swapOrders'],
    () => {
      const $events = cent.getEvents().pipe(
        filter(({ api, events }) => {
          return events.some(
            ({ event }) =>
              api.events.orderBook.OrderCreated.is(event) ||
              api.events.orderBook.OrderCancelled.is(event) ||
              api.events.orderBook.OrderUpdated.is(event) ||
              api.events.orderBook.OrderFulfillment.is(event)
          )
        })
      )
      return cent.getApi().pipe(
        switchMap((api) => api.query.orderBook.orders.entries()),
        map((rawOrders) => {
          return rawOrders.map(([, value]) => {
            const order = value.toPrimitive() as {
              orderId: number
              placingAccount: string
              assetInId: CurrencyKey
              assetOutId: CurrencyKey
              buyAmount: string
              initialBuyAmount: string
              maxSellRate: string
              minFullfillmentAmount: string
              maxSellAmount: string
            }

            const assetInId = parseCurrencyKey(order.assetInId)
            const assetOutId = parseCurrencyKey(order.assetOutId)
            const buyCurrency = findCurrency(currencies!, assetInId)!
            const sellCurrency = findCurrency(currencies!, assetOutId)!
            return {
              id: String(order.orderId),
              account: addressToHex(order.placingAccount),
              buyAmount: new CurrencyBalance(order.buyAmount, buyCurrency!.decimals),
              sellAmount: new CurrencyBalance(order.maxSellAmount, sellCurrency!.decimals),
              price: new Rate(order.maxSellRate),
              buyCurrency,
              sellCurrency,
            }
          })
        }),
        repeatWhen(() => $events)
      )
    },
    { enabled: !!currencies }
  )

  const filtered = orders?.filter(
    (order) =>
      !buyOrSell ||
      isSameCurrency(buyOrSell, order.buyCurrency.key) ||
      isSameCurrency(buyOrSell, order.sellCurrency.key)
  )
  return (
    <PageSection>
      <DataTable data={filtered || []} columns={columns} />
      {selectedOrder && <SwapAndSendDialog order={selectedOrder} open onClose={() => setSelectedOrder(undefined)} />}
    </PageSection>
  )
}

export function SwapAndSendDialog({ open, onClose, order }: { open: boolean; onClose: () => void; order: SwapOrder }) {
  const [account] = useSuitableAccounts({})
  const utils = useCentrifugeUtils()
  const balances = useBalances(account?.actingAddress)
  const api = useCentrifugeApi()
  const [isTransferEnabled, setIsTransferEnabled] = React.useState(false)
  const [tranferReceiverAddress, setTranferReceiverAddress] = React.useState('')
  const [tranferReceiverAddressTouched, setTranferReceiverAddressTouched] = React.useState(false)
  const getNetworkName = useGetNetworkName()

  const balanceDec =
    (balances && findBalance(balances.currencies, order.buyCurrency.key))?.balance.toDecimal() || Dec(0)
  const orderBuyDec = order.buyAmount.toDecimal()
  let orderBuyCurrencyEVMChain = getCurrencyChainId(order.buyCurrency)
  let orderSellCurrencyEVMChain = getCurrencyChainId(order.sellCurrency)

  console.log('orderBuyCurrencyEVMChain', orderBuyCurrencyEVMChain, orderSellCurrencyEVMChain)

  const { execute, reset, isLoading, lastCreatedTransaction } = useCentrifugeTransaction(
    'Fulfill order',
    (cent) => (args: [transferTo: string | null], options) => {
      const [transferTo] = args
      const swapTx = api.tx.orderBook.fillOrderFull(order.id)

      let tx = swapTx
      if (transferTo) {
        tx = api.tx.utility.batchAll([
          swapTx,
          api.tx.liquidityPools.transfer(
            order.sellCurrency.key,
            { EVM: [orderSellCurrencyEVMChain, transferTo] },
            order.sellAmount
          ),
        ])
      }

      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isTransferEnabled && !isEvmAddress(tranferReceiverAddress)) return

    execute([isTransferEnabled ? tranferReceiverAddress : null], { account })
  }

  function close() {
    reset()
    onClose()
  }

  const balanceLow = balanceDec.lt(orderBuyDec)

  const disabled = balanceLow || (isTransferEnabled && !isEvmAddress(tranferReceiverAddress))

  if (!account) return null

  return (
    <Dialog isOpen={open} onClose={close} title="Fulfill order">
      <form onSubmit={submit}>
        <Stack gap={3}>
          <Stack alignSelf="center" gap={5}>
            <Shelf alignItems="center" alignSelf="center" gap={4} flexWrap="nowrap" mb={2}>
              <Text variant="heading3" style={{ position: 'relative' }}>
                <Text fontSize={24}>{formatBalance(order.buyAmount)}</Text> {order.buyCurrency.symbol}
                <Box position="absolute" top="100%" left={0}>
                  <Text
                    variant="label2"
                    color={balanceLow ? 'statusCritical' : undefined}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {formatBalance(balanceDec, order.buyCurrency.symbol)} available
                  </Text>
                </Box>
              </Text>
              <IconArrowRight />
              <Text variant="heading3">
                <Text fontSize={24}>{formatBalance(order.sellAmount)}</Text> {order.sellCurrency.symbol}
              </Text>
            </Shelf>
            {balanceLow && (
              <TextInput
                label={
                  orderBuyCurrencyEVMChain
                    ? `Send ${order.buyCurrency.symbol} from ${getNetworkName(
                        Number(orderBuyCurrencyEVMChain)
                      )} to this address on Centrifuge Chain`
                    : `Send ${order.buyCurrency.symbol} to this address on Centrifuge Chain`
                }
                value={utils.formatAddress(account.actingAddress)}
                readOnly
                rightElement={
                  <IconButton
                    onClick={() => copyToClipboard(utils.formatAddress(account.actingAddress))}
                    title="Copy address to clipboard"
                  >
                    <IconCopy />
                  </IconButton>
                }
              />
            )}
          </Stack>

          {orderSellCurrencyEVMChain && (
            <Card p={2}>
              <Stack gap={2}>
                <Checkbox
                  label={`Transfer swapped funds to ${getNetworkName(Number(orderSellCurrencyEVMChain))}`}
                  checked={isTransferEnabled}
                  onChange={(e) => setIsTransferEnabled(e.target.checked)}
                />
                <Stack as="fieldset" disabled={!isTransferEnabled} gap={2} minWidth={0} m={0} p={0} border={0}>
                  <TextInput
                    label="Receiver EVM address"
                    value={tranferReceiverAddress}
                    placeholder="0x..."
                    onChange={(e) => {
                      setTranferReceiverAddress(e.target.value)
                      setTranferReceiverAddressTouched(true)
                    }}
                    disabled={!isTransferEnabled}
                    errorMessage={
                      tranferReceiverAddressTouched && !isEvmAddress(tranferReceiverAddress)
                        ? 'Not a valid address'
                        : undefined
                    }
                  />
                </Stack>
              </Stack>
            </Card>
          )}
          <ButtonGroup>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled} loading={isLoading}>
              Swap {isTransferEnabled && 'and transfer'}
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </Dialog>
  )
}
