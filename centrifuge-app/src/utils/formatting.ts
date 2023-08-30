import { CurrencyBalance, CurrencyMetadata, Perquintill, Price, TokenBalance } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

export function formatBalance(
  amount: CurrencyBalance | TokenBalance | Price | Decimal | number,
  currency?: string | CurrencyMetadata,
  precision = 0,
  minPrecision = precision
) {
  const formattedAmount = (
    amount instanceof TokenBalance || amount instanceof CurrencyBalance || amount instanceof Price
      ? amount.toFloat()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  ).toLocaleString('en', {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: precision,
  })
  return currency ? `${formattedAmount} ${typeof currency === 'string' ? currency : currency.symbol}` : formattedAmount
}

export function formatBalanceAbbreviated(
  amount: CurrencyBalance | TokenBalance | Decimal | number,
  currency?: string,
  decimals = 1
) {
  const amountNumber =
    amount instanceof TokenBalance || amount instanceof CurrencyBalance
      ? amount.toFloat()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  let formattedAmount = ''
  if (amountNumber >= 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`
  } else if (amountNumber > 999) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`
  } else {
    formattedAmount = `${amountNumber.toFixed(decimals)}`
  }
  return currency ? `${formattedAmount} ${currency}` : formattedAmount
}

export function formatPercentage(
  amount: Perquintill | Decimal | number,
  includeSymbol = true,
  options: Intl.NumberFormatOptions = {}
) {
  const formattedAmount = (
    amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  ).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
  return includeSymbol ? `${formattedAmount}%` : formattedAmount
}

export function roundDown(float: Decimal | number, precision: number = 2) {
  return Math.floor((float instanceof Decimal ? float.toNumber() : float) * 10 ** precision) / 10 ** precision
}

export function truncateText(txt: string, len: number) {
  if (txt.length > len) {
    return `${txt.slice(0, len)}...`
  }
  return txt
}
