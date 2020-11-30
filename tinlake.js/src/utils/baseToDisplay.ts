import BN from 'bn.js'

export const baseToDisplay = (base: string | BN, decimals: number): string => {
  let baseStr = typeof base === 'string' ? base : base.toString()
  const neg = baseStr.includes('-')

  baseStr = baseStr.replace(/-/g, '')

  const a = baseStr.slice(0, -decimals) || '0'
  const b = baseStr.slice(-decimals).padStart(decimals, '0')

  const res = `${a}.${b}`

  return neg ? `-${res}` : res
}
