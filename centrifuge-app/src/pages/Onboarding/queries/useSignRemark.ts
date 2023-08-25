import {
  Network,
  useBalances,
  useCentrifuge,
  useCentrifugeTransaction,
  useEvmProvider,
  useTransactions,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { useNativeBalance } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/evm/utils'
import { Contract } from '@ethersproject/contracts'
import React, { useEffect } from 'react'
import { UseMutateFunction } from 'react-query'
import { lastValueFrom } from 'rxjs'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { ethConfig } from '../../../config'
import { Dec } from '../../../utils/Decimal'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import RemarkerAbi from './abi/Remarker.abi.json'

export const useSignRemark = (
  sendDocumentsToIssuer: UseMutateFunction<
    Response,
    unknown,
    {
      txHash: string
      blockNumber: string
      isEvmOnSubstrate?: boolean
      chainId: Network
    },
    unknown
  >
) => {
  const evmProvider = useEvmProvider()
  const [isEvmTxLoading, setIsEvmTxLoading] = React.useState(false)
  const [isSubstrateTxLoading, setIsSubstrateTxLoading] = React.useState(false)
  const centrifuge = useCentrifuge()
  const { updateTransaction, addOrUpdateTransaction } = useTransactions()
  const {
    connectedType,
    isEvmOnSubstrate,
    substrate: { selectedAddress, selectedAccount },
    evm: { selectedAddress: evmSelectedAddress, chainId: evmChainId },
    connectedNetwork,
  } = useWallet()
  const [expectedTxFee, setExpectedTxFee] = React.useState(Dec(0))
  const balances = useBalances(selectedAddress || undefined)
  const { data: evmBalance } = useNativeBalance()
  const { authToken } = useOnboardingAuth()
  const [account] = useSuitableAccounts({ actingAddress: [selectedAddress || ''] })

  const substrateMutation = useCentrifugeTransaction('Sign remark', (cent) => cent.remark.signRemark, {
    onSuccess: async (_, result) => {
      try {
        let txHash: string
        let blockNumber: string
        // @ts-expect-error
        if (isEvmOnSubstrate && result?.[0]?.wait) {
          // @ts-expect-error
          const evmResult = await result[0].wait()
          txHash = evmResult?.transactionHash
          blockNumber = evmResult?.blockNumber.toString()
        } else {
          txHash = result.txHash.toHex()
          // @ts-expect-error
          blockNumber = result.blockNumber.toString()
        }
        await sendDocumentsToIssuer({
          txHash,
          blockNumber,
          isEvmOnSubstrate,
          chainId: connectedNetwork || 'centrifuge',
        })
        setIsSubstrateTxLoading(false)
      } catch (e) {
        setIsSubstrateTxLoading(false)
      }
    },
  })

  const getBalanceForSigning = async () => {
    const txIdSignRemark = Math.random().toString(36).substr(2)
    addOrUpdateTransaction({
      id: txIdSignRemark,
      title: `Get ${balances?.native.currency.symbol || 'CFG'}`,
      status: 'pending',
      args: [],
    })
    // add just enough native currency to be able to sign remark
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getBalanceForSigning`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status !== 201) {
      addOrUpdateTransaction({
        id: txIdSignRemark,
        title: `Get ${balances?.native.currency.symbol || 'CFG'}`,
        status: 'failed',
        args: [],
      })
      setIsSubstrateTxLoading(false)
      throw new Error('Unable to get balance for signing')
    } else {
      addOrUpdateTransaction({
        id: txIdSignRemark,
        title: `Get ${balances?.native.currency.symbol || 'CFG'}`,
        status: 'succeeded',
        args: [],
      })
    }
  }

  const signSubstrateRemark = async (args: [message: string]) => {
    setIsSubstrateTxLoading(true)
    if (balances?.native.balance?.toDecimal().lt(expectedTxFee.mul(1.1))) {
      await getBalanceForSigning()
    }
    if (isEvmOnSubstrate && evmBalance?.toDecimal().lt(expectedTxFee.mul(1.1))) {
      await getBalanceForSigning()
    }
    substrateMutation.execute(args, { account })
  }

  useEffect(() => {
    const executePaymentInfo = async () => {
      if ((selectedAccount && selectedAccount.signer) || (isEvmOnSubstrate && evmSelectedAddress)) {
        const address =
          isEvmOnSubstrate && evmSelectedAddress
            ? centrifuge.utils.evmToSubstrateAddress(evmSelectedAddress, evmChainId!)
            : selectedAccount?.address
        const signer = selectedAccount?.signer || (await evmProvider?.getSigner())
        const api = await centrifuge.connect(address!, signer as any)
        const paymentInfo = await lastValueFrom(
          api.remark.signRemark(
            [
              `I hereby sign the subscription agreement of pool [POOL_ID] and tranche [TRANCHE_ID]: [IPFS_HASH_OF_TEMPLATE]`,
            ],
            {
              paymentInfo: address!,
            }
          )
        )
        const txFee = paymentInfo.partialFee.toDecimal()
        setExpectedTxFee(txFee)
      }
    }
    executePaymentInfo()
  }, [centrifuge, selectedAccount])

  const signEvmRemark = async (args: [message: string]) => {
    const txId = Math.random().toString(36).substr(2)
    setIsEvmTxLoading(true)
    addOrUpdateTransaction({
      id: txId,
      title: 'Sign remark',
      status: 'creating',
      args,
    })
    try {
      const [message] = args
      const remarkerContract = new Contract(ethConfig.remarkerAddress, RemarkerAbi)
      if (!evmProvider?.getSigner()) {
        throw new Error('Signer may not be set')
      }
      const connectedContract = remarkerContract.connect(evmProvider?.getSigner())
      const result = await connectedContract.functions.remarkWithEvent(message)
      updateTransaction(txId, () => ({
        status: 'pending',
        hash: result.hash,
      }))
      const finalizedTx = await result.wait()
      await sendDocumentsToIssuer({
        txHash: result.hash,
        blockNumber: finalizedTx.blockNumber.toString(),
        chainId: connectedNetwork || 'centrifuge',
      })
      updateTransaction(txId, () => ({
        status: 'succeeded',
        hash: result.hash,
      }))
      setIsEvmTxLoading(false)
    } catch (e) {
      console.log(e)
      updateTransaction(txId, () => ({
        status: 'failed',
        error: e,
      }))
      setIsEvmTxLoading(false)
    }
  }

  return connectedType === 'evm' && !isEvmOnSubstrate
    ? { execute: signEvmRemark, isLoading: isEvmTxLoading }
    : { execute: signSubstrateRemark, isLoading: isSubstrateTxLoading }
}
