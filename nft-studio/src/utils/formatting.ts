import Decimal from 'decimal.js-light'

const currencySymbols = {
  native: 'AIR',
  usd: 'kUSD',
}

export function getCurrencySymbol(currency?: string) {
  return (currency && currencySymbols[currency as keyof typeof currencySymbols]) || currency || ''
}

export function formatBalance(amount: Decimal | number, currency?: string) {
  const formattedAmount = (amount instanceof Decimal ? amount.toNumber() : amount).toLocaleString('en', {
    maximumFractionDigits: 0,
  })
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}
