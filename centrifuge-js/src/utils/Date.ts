export function parseDate(date: number) {
  const isDateInSeconds = date.toString().length <= 10
  return isDateInSeconds ? new Date(date * 1000) : new Date(date)
}
