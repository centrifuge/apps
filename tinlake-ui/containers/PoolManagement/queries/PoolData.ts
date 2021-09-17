import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
import { csvName } from './index'

export async function rawPoolData({ poolData }: { poolId: string; poolData: PoolData }) {
  const rows: any[] = []
  // TODO: this should clearly be refactored to a recursive method
  Object.keys(poolData as any).forEach((key: string) => {
    const value = (poolData as any)[key]
    if (key === 'junior' || key === 'senior' || key === 'maker' || key === 'risk') {
      Object.keys(value).forEach((subKey: string) => {
        if (key === 'risk') {
          return
        } else {
          rows.push([`${key}.${subKey}`, value[subKey].toString()])
        }
      })
    } else {
      rows.push([key, value.toString()])
    }
  })

  downloadCSV(rows, csvName(`Raw pool data`))

  return true
}
