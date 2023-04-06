import { useCentrifugeTransaction, useEvmProvider, useWallet } from '@centrifuge/centrifuge-react'
import { Contract } from '@ethersproject/contracts'
import React from 'react'
import { UseMutateFunction } from 'react-query'
import { switchMap } from 'rxjs'
import { OnboardingPool, useOnboarding } from '../../../components/OnboardingProvider'
import { OnboardingUser } from '../../../types'
import RemarkerAbi from './abi/Remarker.abi.json'

export const useSignRemark = (
  sendDocumentsToIssuer: UseMutateFunction<
    Response,
    unknown,
    {
      txHash: string
      blockNumber: string
    },
    unknown
  >
) => {
  const evmProvider = useEvmProvider()
  const [isEvmTxLoading, setIsEvmTxLoading] = React.useState(false)
  const { pool } = useOnboarding<OnboardingUser, NonNullable<OnboardingPool>>()
  const { connectedType } = useWallet()

  const poolId = pool.id
  const trancheId = pool.trancheId

  const substrateMutation = useCentrifugeTransaction(
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
        const txHash = result.txHash.toHex()
        // @ts-expect-error
        const blockNumber = result.blockNumber.toString()
        await sendDocumentsToIssuer({ txHash, blockNumber })
      },
    }
  )

  const signEvmRemark = async () => {
    setIsEvmTxLoading(true)
    try {
      // TODO: get contract from env variable
      const remarkerContract = new Contract('0x6E395641087a4938861d7ada05411e3146175F58', RemarkerAbi)
      if (!evmProvider?.getSigner()) {
        throw new Error('Signer may not be set')
      }
      const connectedContract = remarkerContract.connect(evmProvider?.getSigner())
      // TODO: add toast when tx starts
      const result = await connectedContract.functions.remarkWithEvent(
        `Signed subscription agreement for pool: ${poolId} tranche: ${trancheId}`
      )
      const finalizedTx = await result.wait()
      await sendDocumentsToIssuer({ txHash: result.hash, blockNumber: finalizedTx.blockNumber.toString() })
      setIsEvmTxLoading(false)
    } catch (e) {
      console.log(e)
      setIsEvmTxLoading(false)
    }
  }

  return connectedType === 'evm' ? { execute: signEvmRemark, isLoading: isEvmTxLoading } : substrateMutation
}
