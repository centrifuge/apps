import { Currency } from '@centrifuge/sdk/dist/utils/BigInt'
import Decimal from 'decimal.js-light'
import { Dec } from './Decimal'

export function formatBalance(amount: Decimal | Currency | number, displayDecimals: number, currency?: string): string {
  let val: Decimal

  if (typeof amount === 'number') {
    val = Dec(amount.toString())
  } else if (amount instanceof Decimal) {
    val = amount
  } else if (amount && typeof amount.toDecimal === 'function') {
    val = amount.toDecimal()
  } else {
    throw new Error('Unsupported amount type')
  }

  const rounded = val.toFixed(displayDecimals)

  const parts = rounded.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedWithCommas = parts.join('.')

  return currency ? `${formattedWithCommas} ${currency}` : formattedWithCommas
}

export function formatPercentage(
  rate: Decimal | number | string,
  precision = 2,
  showSymbol = true,
  options: Intl.NumberFormatOptions = {}
): string {
  const formattedAmount = (rate instanceof Decimal ? rate.toNumber() : Number(rate)).toLocaleString('en', {
    minimumFractionDigits: precision || 2,
    maximumFractionDigits: precision || 2,
    ...options,
  })

  return showSymbol ? `${formattedAmount}%` : formattedAmount
}

export function formatBalanceAbbreviated(decimalVal: Decimal | number, displayDecimals = 1, currency?: string): string {
  let val: Decimal
  if (typeof decimalVal === 'number') {
    val = Dec(decimalVal.toString())
  } else {
    val = decimalVal as Decimal
  }

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
