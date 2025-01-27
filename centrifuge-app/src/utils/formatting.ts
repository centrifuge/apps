import { CurrencyBalance, CurrencyMetadata, Perquintill, Price, Rate, TokenBalance } from '@centrifuge/centrifuge-js'
import { Currency } from '@centrifuge/sdk'
import Decimal from 'decimal.js-light'

export function formatBalance(
  amount: CurrencyBalance | TokenBalance | Price | Rate | Decimal | number,
  currency?: string | CurrencyMetadata,
  precision = 0,
  minPrecision = precision
) {
  const formattedAmount = (
    amount instanceof TokenBalance ||
    amount instanceof CurrencyBalance ||
    amount instanceof Price ||
    amount instanceof Rate
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
  const absAmount = Math.abs(amountNumber)

  if (absAmount >= 1e9) {
    formattedAmount = `${(amountNumber / 1e9).toFixed(decimals)}B`
  } else if (absAmount >= 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`
  } else if (absAmount > 999) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`
  } else {
    formattedAmount = `${amountNumber.toFixed(decimals)}`
  }

  return currency ? `${formattedAmount} ${currency}` : formattedAmount
}

export function formatPercentage(
  amount: Perquintill | Decimal | number | string,
  includeSymbol = true,
  options: Intl.NumberFormatOptions = {},
  precision?: number
) {
  const formattedAmount = (
    amount instanceof Rate || amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
      ? amount.toNumber()
      : Number(amount)
  ).toLocaleString('en', {
    minimumFractionDigits: precision || 2,
    maximumFractionDigits: precision || 2,
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

// FORMAT FUNCTIONS FOR NEW SDK

export function formatDecimal(decimalVal: any, displayDecimals: number, currency?: string): string {
  const val = decimalVal instanceof Decimal ? decimalVal : decimalVal.toDecimal()

  const rounded = val.toFixed(displayDecimals)

  const parts = rounded.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedWithCommas = parts.join('.')

  return currency ? `${formattedWithCommas} ${currency}` : formattedWithCommas
}

export function formatToPercentage(
  rate: Rate,
  precision = 2,
  showSymbol = true,
  options: Intl.NumberFormatOptions = {}
): string {
  const percentDecimal = rate.toPercent().toNumber()

  const strValue = percentDecimal.toLocaleString('en', {
    minimumFractionDigits: precision || 2,
    maximumFractionDigits: precision || 2,
    ...options,
  })

  return showSymbol ? `${strValue}%` : strValue
}

export function formatDecimalAbbreviated(
  decimalVal: Decimal | number | Currency,
  displayDecimals = 1,
  currency?: string
): string {
  const val =
    decimalVal instanceof Decimal
      ? decimalVal
      : decimalVal instanceof Currency
      ? decimalVal.toDecimal()
      : new Decimal(decimalVal)

  const amountNumber = val.toNumber()
  const absVal = Math.abs(amountNumber)
  let formattedAmount = ''

  if (absVal >= 1e9) {
    formattedAmount = (amountNumber / 1e9).toFixed(displayDecimals) + 'B'
  } else if (absVal >= 1e6) {
    formattedAmount = (amountNumber / 1e6).toFixed(displayDecimals) + 'M'
  } else if (absVal >= 1e3) {
    formattedAmount = (amountNumber / 1e3).toFixed(displayDecimals) + 'K'
  } else {
    const rounded = val.toFixed(displayDecimals)
    const parts = rounded.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    formattedAmount = parts.join('.')
  }

  return currency ? `${formattedAmount} ${currency}` : formattedAmount
}
