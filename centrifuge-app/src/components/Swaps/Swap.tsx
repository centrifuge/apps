import { CurrencyBalance, CurrencyKey, findBalance, findCurrency, Rate } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeApi, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { CentrifugeTransactionOptions } from '@centrifuge/centrifuge-react/dist/hooks/useCentrifugeTransaction'
import { Button, Card, CurrencyInput, SelectInner, Stack } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useCurrencies } from '../../utils/useCurrencies'
import { useSuitableAccountPicker } from '../../utils/usePermissions'

type SwapProps = {
  defaultBuy?: CurrencyKey
  defaultSell?: CurrencyKey
}

export function Swap({ defaultBuy, defaultSell }: SwapProps) {
  const [account, accountPicker] = useSuitableAccountPicker({})
  const [buyCurrencyKey, setBuyCurrency] = React.useState(defaultBuy)
  const [sellCurrencyKey, setSellCurrency] = React.useState(defaultSell)
  const [buy, setBuy] = React.useState(0)
  const [sell, setSell] = React.useState<number | Decimal>(0)
  const [price, setPrice] = React.useState(1)
  const [lastChanged, setLastChanged] = React.useState<'buy' | 'sell'>('buy')
  const api = useCentrifugeApi()
  const balances = useBalances(account?.actingAddress)

  const sellBalance =
    (balances && sellCurrencyKey && findBalance(balances.currencies, sellCurrencyKey)?.balance.toDecimal()) || Dec(0)

  const allCurrencies = useCurrencies()
  const currencies = allCurrencies?.filter((cur) => typeof cur.key === 'object' && 'ForeignAsset' in cur.key)

  const { execute, isLoading } = useCentrifugeTransaction(
    'Place order',
    (cent) => (_: [], options?: CentrifugeTransactionOptions) => {
      const buyDec = lastChanged === 'buy' ? buy : Dec(sell).div(price)
      const buyAmount = CurrencyBalance.fromFloat(buyDec, buyCurrency!.decimals)
      const buyPrice = Rate.fromFloat(price)
      return cent.wrapSignAndSend(
        api,
        api.tx.orderBook.createOrderV1(buyCurrencyKey, sellCurrencyKey, buyAmount, buyPrice),
        options
      )
    }
  )

  const buyCurrency = buyCurrencyKey ? findCurrency(currencies ?? [], buyCurrencyKey) : undefined
  const sellCurrency = sellCurrencyKey ? findCurrency(currencies ?? [], sellCurrencyKey) : undefined

  const buyAmount = lastChanged === 'buy' ? buy : toNumber(sell) / price
  const sellAmount = lastChanged === 'sell' ? toNumber(sell) : buy * price

  return (
    <Card p={2}>
      <Stack gap={1}>
        {accountPicker}
        <CurrencyInput
          label="Buy"
          value={buyAmount}
          onChange={(val) => {
            setBuy(val)
            setSell(val * price)
            setLastChanged('buy')
          }}
          currency={
            <SelectInner
              value={buyCurrency?.symbol ?? ''}
              options={[
                { label: 'Select', value: '', disabled: true },
                ...(currencies?.map((cur) => ({ label: cur.symbol, value: cur.symbol })) ?? []),
              ]}
              onChange={(e) => {
                const key = currencies?.find((cur) => cur.symbol === e.target.value)?.key
                if (key) setBuyCurrency(key)
              }}
              style={{ textAlign: 'right' }}
            />
          }
        />
        <CurrencyInput
          label="Price"
          value={price}
          onChange={(val) => {
            setPrice(val)
          }}
          currency={sellCurrency?.symbol}
        />
        <CurrencyInput
          label="Sell"
          value={sellAmount}
          onChange={(val) => {
            setSell(val)
            setLastChanged('sell')
          }}
          secondaryLabel={sellCurrency && `${formatBalance(roundDown(sellBalance), sellCurrency, 2)} available`}
          onSetMax={() => {
            setSell(sellBalance)
            setLastChanged('sell')
          }}
          currency={
            <SelectInner
              value={sellCurrency?.symbol ?? ''}
              options={[
                { label: 'Select', value: '' },
                ...(currencies?.map((cur) => ({ label: cur.symbol, value: cur.symbol })) ?? []),
              ]}
              onChange={(e) => {
                const key = currencies?.find((cur) => cur.symbol === e.target.value)?.key
                if (key) setSellCurrency(key)
              }}
              style={{ textAlign: 'right' }}
            />
          }
        />
        <Button loading={isLoading} onClick={() => execute([], { account })}>
          Submit
        </Button>
      </Stack>
    </Card>
  )
}
function toNumber(n: '' | number | Decimal) {
  return n instanceof Decimal ? n.toNumber() : Number(n)
}
