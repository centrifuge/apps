import { Block } from '@polkadot/types/interfaces'
import React from 'react'
import { useCentrifuge } from '../components/CentrifugeProvider'

export const useBlock = () => {
  const cent = useCentrifuge()
  const [block, setBlock] = React.useState<Block>()

  const $source = cent.getBlocks()

  React.useEffect(() => {
    if (!$source) return
    const sub = $source.pipe().subscribe({
      next: ({ block }) => {
        setBlock(block)
      },
    })
    return () => {
      sub.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { block }
}
