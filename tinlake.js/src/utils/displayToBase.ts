export const displayToBase = (display: string, decimals: number): string => {
  const neg = display.includes('-')

  const str = display.replace(/-/g, '')

  const a = str.split('.')[0]
  const b = (str.split('.')[1] || '').padEnd(decimals, '0').substr(0, decimals)
  const res = `${a}${b}`

  return neg ? `-${res}` : res
}
