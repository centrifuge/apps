import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { UseMutateFunction } from 'react-query'
import { switchMap } from 'rxjs'
import { OnboardingPool, useOnboarding } from '../../../components/OnboardingProvider'
import { OnboardingUser } from '../../../types'

export const useSignRemark = (
  sendDocumentsToIssuer: UseMutateFunction<
    Response,
    unknown,
    {
      extrinsicHash: string
      blockNumber: string
    },
    unknown
  >
) => {
  const { pool } = useOnboarding<OnboardingUser, NonNullable<OnboardingPool>>()

  const poolId = pool.id
  const trancheId = pool.trancheId

  const mutation = useCentrifugeTransaction(
    'sign remark',
    (cent) => () =>
      cent
        .getApi()
        .pipe(
          switchMap((api) =>
            cent.wrapSignAndSend(
              api,
              api.tx.system.remark(`Signed subscription agreement for pool: ${poolId} tranche: ${trancheId}`)
            )
          )
        ),
    {
      onSuccess: async (_, result) => {
        const extrinsicHash = result.txHash.toHex()
        // @ts-expect-error
        const blockNumber = result.blockNumber.toString()
        await sendDocumentsToIssuer({ extrinsicHash, blockNumber })
      },
    }
  )

  return mutation
}
