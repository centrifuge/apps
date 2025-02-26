import {
  addressToHex,
  CurrencyBalance,
  CurrencyKey,
  CurrencyMetadata,
  findBalance,
  findCurrency,
  getCurrencyLocation,
  isSameCurrency,
  parseCurrencyKey,
  Price,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  ConnectionGuard,
  truncateAddress,
  useBalances,
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
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
  CurrencyInput,
  Dialog,
  IconArrowRight,
  IconButton,
  IconCopy,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { filter, map, repeatWhen, switchMap } from 'rxjs'
import { parachainNames } from '../../config'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { findAssetPairPrice, useAssetPairPrices, useCurrencies } from '../../utils/useCurrencies'
import { useSuitableAccounts } from '../../utils/usePermissions'
import { address, combine, max, min, required } from '../../utils/validation'
import { ButtonGroup } from '../ButtonGroup'
import { Column, DataTable } from '../DataTable'
import { PageSection } from '../PageSection'

const TOKENMUX_PALLET_ACCOUNTID = '0x6d6f646c6366672f746d75780000000000000000000000000000000000000000'

export type OrdersProps = {
  buyOrSell?: CurrencyKey
}

export type SwapOrder = {
  id: string
  account: string
  buyAmount: CurrencyBalance
  sellAmount: CurrencyBalance
  price: Price
  buyCurrency: CurrencyMetadata
  sellCurrency: CurrencyMetadata
  minFulfillmentAmount: CurrencyBalance
  isMuxSwap: boolean
  isMuxDeposit: boolean
  isMuxBurn: boolean
}

export function Orders({ buyOrSell }: OrdersProps) {
  const cent = useCentrifuge()
  const currencies = useCurrencies()
  const utils = useCentrifugeUtils()
  const [selectedOrder, setSelectedOrder] = React.useState<SwapOrder>()
  const marketPrices = useAssetPairPrices()

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
          <ConnectionGuard networks={['centrifuge']} body="">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedOrder(row)
              }}
              small
            >
              Fulfill order
            </Button>
          </ConnectionGuard>
        ),
        flex: '1',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [ordersWithSomePrices] = useCentrifugeQuery(
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
              currencyIn: CurrencyKey
              currencyOut: CurrencyKey
              amountIn: string
              maxSellAmount: string
              amountOut: string
              amountOutInitial: string
              ratio: { custom: string } | { market: null }
            }

            const currencyIn = parseCurrencyKey(order.currencyIn)
            const currencyOut = parseCurrencyKey(order.currencyOut)
            const buyCurrency = findCurrency(currencies!, currencyIn)!
            const sellCurrency = findCurrency(currencies!, currencyOut)!
            const sellAmount = new CurrencyBalance(order.amountOut, sellCurrency!.decimals)

            const isMuxBurn =
              typeof sellCurrency.key !== 'string' &&
              'LocalAsset' in sellCurrency.key &&
              String(sellCurrency.key.LocalAsset) === String(buyCurrency.additional?.localRepresentation)
            const isMuxDeposit =
              typeof buyCurrency.key !== 'string' &&
              'LocalAsset' in buyCurrency.key &&
              String(buyCurrency.key.LocalAsset) === String(sellCurrency.additional?.localRepresentation)
            const isMuxSwap = isMuxBurn || isMuxDeposit

            const price = isMuxSwap
              ? Price.fromFloat(1)
              : 'market' in order.ratio
              ? null
              : new Price(order.ratio.custom)

            return {
              id: String(order.orderId),
              account: addressToHex(order.placingAccount),
              buyAmount: price
                ? CurrencyBalance.fromFloat(sellAmount.toDecimal().mul(price.toDecimal()), buyCurrency!.decimals)
                : null,
              sellAmount,
              price,
              buyCurrency,
              sellCurrency,
              isMuxSwap,
              isMuxBurn,
              isMuxDeposit,
            }
          })
        }),
        repeatWhen(() => $events)
      )
    },
    { enabled: !!currencies }
  )

  const orders = ordersWithSomePrices?.map((order) => {
    const price = marketPrices ? findAssetPairPrice(marketPrices, order.buyCurrency, order.sellCurrency) : null
    return {
      ...order,
      price: order.price || price || Price.fromFloat(0),
      buyAmount:
        order.buyAmount ||
        (price
          ? CurrencyBalance.fromFloat(order.sellAmount.toDecimal().mul(price.toDecimal()), order.buyCurrency!.decimals)
          : CurrencyBalance.fromFloat(0, 0)),
    }
  })

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

  const balances = useBalances(order.isMuxBurn ? TOKENMUX_PALLET_ACCOUNTID : account?.actingAddress)
  const api = useCentrifugeApi()
  const consts = useCentrifugeConsts()
  const getNetworkName = useGetNetworkName()

  const minFulfillDec = consts.orderBook.minFulfillment.toDecimal().mul(order.price.toDecimal())

  const balanceDec =
    (balances && findBalance(balances.currencies, order.buyCurrency.key))?.balance.toDecimal() || Dec(0)
  const orderBuyDec = order.buyAmount.toDecimal()
  const orderBuyCurrencyLocation = getCurrencyLocation(order.buyCurrency)
  const orderSellCurrencyLocation = getCurrencyLocation(order.sellCurrency)

  function getLocationName(location: WithdrawAddress['location']) {
    return typeof location === 'string'
      ? getNetworkName(location as any)
      : 'parachain' in location
      ? parachainNames[location.parachain]
      : getNetworkName(location.evm)
  }

  const { execute, reset, isLoading, lastCreatedTransaction } = useCentrifugeTransaction(
    'Fulfill order',
    (cent) => (args: [transferTo: string | null, amount: CurrencyBalance | null], options) => {
      const [transferTo, amount] = args
      let fn = api.tx.orderBook.fillOrder
      if (order.isMuxSwap) {
        fn = api.tx.tokenMux.matchSwap
      }
      let swapTx = fn(order.id, order.sellAmount.toString())
      if (amount) {
        swapTx = fn(order.id, amount.toString())
      }

      if (transferTo) {
        return cent.pools
          .withdraw(
            [amount ? amount : order.sellAmount, order.sellCurrency.key, transferTo, orderSellCurrencyLocation],
            { batch: true }
          )
          .pipe(
            switchMap((withdrawTx) => {
              const tx = api.tx.utility.batchAll([swapTx, withdrawTx])
              return cent.wrapSignAndSend(api, tx, options)
            })
          )
      }

      return cent.wrapSignAndSend(api, swapTx, options)
    }
  )

  const initialValues = {
    isTransferEnabled: false,
    tranferReceiverAddress: '',
    isPartialEnabled: false,
    partialTransfer: '' as number | '' | Decimal,
  }

  const form = useFormik({
    initialValues,
    onSubmit: (values, actions) => {
      actions.setSubmitting(false)

      if (values.isTransferEnabled && !isAddress(values.tranferReceiverAddress)) return

      execute(
        [
          values.isTransferEnabled ? values.tranferReceiverAddress : null,
          values.isPartialEnabled && values.partialTransfer
            ? CurrencyBalance.fromFloat(
                Dec(values.partialTransfer).div(order.price.toDecimal()),
                order.sellCurrency.decimals
              )
            : null,
        ],
        { account }
      )
    },
  })

  React.useEffect(() => {
    if (lastCreatedTransaction?.status === 'pending') {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTransaction?.status])

  function close() {
    reset()
    onClose()
  }

  if (!account) return null

  const balanceLow = !order.isMuxDeposit && balanceDec.lt(orderBuyDec)
  const { isTransferEnabled, isPartialEnabled } = form.values
  const disabled = isPartialEnabled ? false : balanceLow

  return (
    <Dialog isOpen={open} onClose={close} title="Fulfill order">
      <FormikProvider value={form}>
        <Form>
          <Stack gap={3}>
            <Stack alignSelf={order.isMuxSwap ? 'start' : 'center'} gap={5}>
              <Shelf alignItems="center" alignSelf="center" gap={4} flexWrap="nowrap" mb={2}>
                <Text variant="heading3" style={{ position: 'relative' }}>
                  {order.isMuxSwap ? (
                    <>
                      {order.isMuxDeposit ? 'Depositing' : 'Redeeming'} {formatBalance(order.buyAmount)}{' '}
                      {order.isMuxDeposit ? order.sellCurrency.symbol : order.buyCurrency.symbol} on Centrifuge
                    </>
                  ) : (
                    <>
                      <Text fontSize={24}>{formatBalance(order.buyAmount)}</Text> {order.buyCurrency.symbol}
                    </>
                  )}
                  {!order.isMuxDeposit && (
                    <Box position="absolute" top="100%" left={0}>
                      <Text
                        variant="label2"
                        color={balanceLow ? 'statusCritical' : undefined}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formatBalance(balanceDec, order.buyCurrency.symbol)} available
                      </Text>
                    </Box>
                  )}
                </Text>
                {!order.isMuxSwap && (
                  <>
                    {' '}
                    <IconArrowRight />
                    <Text variant="heading3">
                      <Text fontSize={24}>{formatBalance(order.sellAmount)}</Text> {order.sellCurrency.symbol}
                    </Text>
                  </>
                )}
              </Shelf>
              {balanceLow && !order.isMuxSwap && (
                <TextInput
                  label={
                    orderBuyCurrencyLocation
                      ? `Send ${order.buyCurrency.symbol} from ${getLocationName(
                          orderBuyCurrencyLocation
                        )} to this address on Centrifuge Chain`
                      : `Send ${order.buyCurrency.symbol} to this address on Centrifuge Chain`
                  }
                  value={utils.formatAddress(account.actingAddress)}
                  readOnly
                  symbol={
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

            {orderBuyDec.gt(minFulfillDec) && !order.isMuxDeposit && (
              <Card p={2}>
                <Stack gap={2}>
                  <Field type="checkbox" name="isPartialEnabled" as={Checkbox} label="Fulfill order partially" />
                  <Stack as="fieldset" disabled={!isPartialEnabled} gap={2} minWidth={0} m={0} p={0} border={0}>
                    <Field
                      name="partialTransfer"
                      validate={
                        isPartialEnabled
                          ? combine(
                              required(),
                              min(
                                minFulfillDec.toNumber(),
                                `Minimum fulfillment: ${formatBalance(minFulfillDec, order.buyCurrency.symbol)}`
                              ),
                              max(balanceDec.toNumber(), 'Balance too low'),
                              max(orderBuyDec.toNumber(), 'Amount exceeds order')
                            )
                          : undefined
                      }
                    >
                      {({ field, meta, form }: FieldProps) => (
                        <CurrencyInput
                          {...field}
                          errorMessage={meta.touched ? meta.error : undefined}
                          disabled={!isPartialEnabled}
                          currency={order.buyCurrency.symbol}
                          onChange={(value) => form.setFieldValue('partialTransfer', value)}
                          onSetMax={() => form.setFieldValue('partialTransfer', balanceDec)}
                          secondaryLabel={`${formatBalance(balanceDec, order.buyCurrency.symbol, 2)} balance`}
                        />
                      )}
                    </Field>
                  </Stack>
                </Stack>
              </Card>
            )}

            {orderSellCurrencyLocation && !order.isMuxSwap && (
              <Card p={2}>
                <Stack gap={2}>
                  <Field
                    type="checkbox"
                    name="isTransferEnabled"
                    as={Checkbox}
                    label={`Transfer swapped funds to ${getLocationName(orderSellCurrencyLocation)}`}
                  />
                  <Stack as="fieldset" disabled={!isTransferEnabled} gap={2} minWidth={0} m={0} p={0} border={0}>
                    <Field
                      name="tranferReceiverAddress"
                      as={TextInput}
                      label="Receiver address"
                      disabled={!isTransferEnabled}
                      validate={isTransferEnabled ? combine(address(), required()) : undefined}
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
                {order.isMuxBurn ? 'Redeem' : order.isMuxDeposit ? 'Deposit' : 'Swap'}{' '}
                {isTransferEnabled && 'and transfer'}
              </Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </FormikProvider>
    </Dialog>
  )
}
