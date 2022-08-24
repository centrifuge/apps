import { encodeAddress } from '@polkadot/util-crypto'
import { combineLatest, map, switchMap, take } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account } from '../types'
import * as utilsPure from '../utils'

const RANGE_FOR_AVG = 10

export function getUtilsModule(inst: CentrifugeBase) {
  function formatAddress(address: Account) {
    return encodeAddress(address, inst.getChainId())
  }

  function getAvgTimePerBlock() {
    const $currentBlock = inst.getBlocks().pipe(take(1))
    const $prevBlock = $currentBlock.pipe(
      switchMap((currentBlock) => {
        const blockNumber = currentBlock.block.header.number.toNumber()
        return inst.getBlockByBlockNumber(blockNumber - RANGE_FOR_AVG)
      })
    )

    return combineLatest([$currentBlock, $prevBlock]).pipe(
      map(([currentBlock, prevBlock]) => {
        const tCurrent = new Date((currentBlock?.block.extrinsics[1].args[0] as any).unwrap().toNumber()).getTime()
        const tPrev = new Date((prevBlock?.block.extrinsics[1].args[0] as any).unwrap().toNumber()).getTime()
        return (tCurrent - tPrev) / RANGE_FOR_AVG
      })
    )
  }

  return {
    ...utilsPure,
    formatAddress,
    getAvgTimePerBlock,
  }
}
