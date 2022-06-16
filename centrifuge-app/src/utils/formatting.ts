import { Balance, Perquintill } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

const currencySymbols = {
  native: 'AIR',
  usd: 'kUSD',
  permissionedeur: 'pEUR',
}

export function getCurrencySymbol(currency?: string) {
  return (currency && currencySymbols[currency.toLowerCase() as keyof typeof currencySymbols]) || currency || ''
}

export function formatBalance(amount: Balance | Decimal | number, currency?: string, precise = false) {
  const formattedAmount = (
    amount instanceof Balance ? amount.toFloat() : amount instanceof Decimal ? amount.toNumber() : amount
  ).toLocaleString('en', {
    minimumFractionDigits: precise ? 4 : 0,
    maximumFractionDigits: precise ? 4 : 0,
  })
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}

export function formatBalanceAbbreviated(amount: Balance | Decimal | number, currency?: string, decimals = 1) {
  const amountNumber =
    amount instanceof Balance ? amount.toFloat() : amount instanceof Decimal ? amount.toNumber() : amount
  let formattedAmount = ''
  if (amountNumber > 999 && amountNumber < 1e6) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`
  } else if (amountNumber > 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`
  } else if (amountNumber <= 999) {
    formattedAmount = `${amountNumber.toFixed(decimals)}`
  }
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}

export function formatPercentage(amount: Perquintill | Decimal | number, includeSymbol = true) {
  const formattedAmount = (
    amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  ).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return includeSymbol ? `${formattedAmount}%` : formattedAmount
}

export function formatThousandSeparator(input: Balance | number | Decimal): string {
  const balance = input instanceof Balance ? input.toDecimal().toString() : input.toString()
  const removeNonNumeric = balance.replace(/[^0-9.]/g, '') // remove non-numeric chars except .
  if (removeNonNumeric.includes('.')) {
    const decimalIndex = removeNonNumeric.indexOf('.')
    // add thousand separator only pre-decimal
    return `${removeNonNumeric.slice(0, decimalIndex).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${removeNonNumeric.slice(
      decimalIndex
    )}`
  }
  return removeNonNumeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function removeThousandSeparator(value?: string | Decimal): number {
  const formattedNumber =
    value instanceof Decimal
      ? parseFloat(value.toString()?.replaceAll(',', '') || '')
      : parseFloat(value?.replaceAll(',', '') || '')

  return formattedNumber
}
