import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'

export const useBlock = () => {
  const [result] = useCentrifugeQuery(['block'], (cent) => {
    return cent.getBlocks()
  })

  return { block: result?.block }
}
