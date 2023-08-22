import { combineLatest, map, switchMap, take } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'
import * as utilsPure from '../utils'

const RANGE_FOR_BLOCKTIME_AVG = 10

export function getUtilsModule(inst: CentrifugeBase) {
  function getAvgTimePerBlock() {
    const $currentBlock = inst.getBlocks().pipe(take(1))
    const $prevBlock = $currentBlock.pipe(
      switchMap((currentBlock) => {
        const blockNumber = currentBlock.block.header.number.toNumber()
        return inst.getBlockByBlockNumber(blockNumber - RANGE_FOR_BLOCKTIME_AVG)
      })
    )

    return combineLatest([$currentBlock, $prevBlock]).pipe(
      map(([currentBlock, prevBlock]) => {
        // each incoming block includes a "timestamp.set" extrinsic at index 1 from which the timestamp can be parsed under args[0]
        const tCurrent = new Date((currentBlock?.block.extrinsics[1].args[0] as any).unwrap().toNumber()).getTime()
        const tPrev = new Date((prevBlock?.block.extrinsics[1].args[0] as any).unwrap().toNumber()).getTime()
        return (tCurrent - tPrev) / RANGE_FOR_BLOCKTIME_AVG
      })
    )
  }

  function getCurrentBlock() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.system.number()),
      map((data) => {
        return data?.toPrimitive() as number
      })
    )
  }

  return {
    ...utilsPure,
    getAvgTimePerBlock,
    getCurrentBlock,
  }
}
