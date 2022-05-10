import { Balance, Perquintill } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

const currencySymbols = {
  native: 'AIR',
  usd: 'kUSD',
  permissionedeur: 'pEUR',
}

export function getCurrencySymbol(currency?: string) {
  return (currency && currencySymbols[currency as keyof typeof currencySymbols]) || currency || ''
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

export function formatBalanceAbbreviated(amount: Balance | Decimal | number, currency?: string, precise = false) {
  const amountNumber =
    amount instanceof Balance ? amount.toFloat() : amount instanceof Decimal ? amount.toNumber() : amount
  let formattedAmount = ''
  if (amountNumber > 999 && amountNumber < 1e6) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(1)}K`
  } else if (amountNumber > 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(1)}M`
  } else if (amountNumber <= 999) {
    formattedAmount = String(amountNumber)
  }
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}

export function formatPercentage(amount: Perquintill | Decimal | number, includeSymbol = true) {
  const formattedAmount = (
    amount instanceof Perquintill ? amount.toPercent() : amount instanceof Decimal ? amount.toNumber() : amount
  ).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return includeSymbol ? `${formattedAmount}%` : formattedAmount
}
