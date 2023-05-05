import {
  useBalances,
  useCentrifuge,
  useCentrifugeTransaction,
  useEvmProvider,
  useTransactions,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { Contract } from '@ethersproject/contracts'
import React, { useEffect } from 'react'
import { UseMutateFunction } from 'react-query'
import { lastValueFrom } from 'rxjs'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { ethConfig } from '../../../config'
import { Dec } from '../../../utils/Decimal'
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
  const [isSubstrateTxLoading, setIsSubstrateTxLoading] = React.useState(false)
  const centrifuge = useCentrifuge()
  const { updateTransaction, addOrUpdateTransaction } = useTransactions()
  const {
    connectedType,
    substrate: { selectedAddress, selectedAccount },
  } = useWallet()
  const [expectedTxFee, setExpectedTxFee] = React.useState(Dec(0))
  const balances = useBalances(selectedAddress || '')
  const { authToken } = useOnboardingAuth()
  const txIdSendDocs = Math.random().toString(36).substr(2)
  const txIdSignRemark = Math.random().toString(36).substr(2)

  const substrateMutation = useCentrifugeTransaction('Sign remark', (cent) => cent.remark.signRemark, {
    onSuccess: async (_, result) => {
      const txHash = result.txHash.toHex()
      addOrUpdateTransaction({
        id: txIdSendDocs,
        title: `Send documents to issuers`,
        status: 'pending',
        args: [],
      })
      // @ts-expect-error
      const blockNumber = result.blockNumber.toString()
      try {
        await sendDocumentsToIssuer({ txHash, blockNumber })
        setIsSubstrateTxLoading(false)
        addOrUpdateTransaction({
          id: txIdSendDocs,
          title: `Send documents to issuers`,
          status: 'succeeded',
          args: [],
        })
      } catch (e) {
        addOrUpdateTransaction({
          id: txIdSendDocs,
          title: `Send documents to issuers`,
          status: 'pending',
          args: (e as any)?.message,
        })
      }
    },
  })

  const signSubstrateRemark = async (args: [message: string]) => {
    setIsSubstrateTxLoading(true)
    if (balances?.native.balance?.toDecimal().lt(expectedTxFee.mul(1.1))) {
      addOrUpdateTransaction({
        id: txIdSignRemark,
        title: `Get ${balances?.native.currency.symbol}`,
        status: 'pending',
        args,
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
          title: `Get ${balances?.native.currency.symbol}`,
          status: 'failed',
          args,
        })
      }
      addOrUpdateTransaction({
        id: txIdSignRemark,
        title: `Get ${balances?.native.currency.symbol}`,
        status: 'succeeded',
        args,
      })
      substrateMutation.execute(args)
      setIsSubstrateTxLoading(false)
    }
  }

  useEffect(() => {
    const executePaymentInfo = async () => {
      if (selectedAccount && selectedAccount.signer) {
        const api = await centrifuge.connect(selectedAccount.address, selectedAccount.signer)
        const paymentInfo = await lastValueFrom(
          api.remark.signRemark([`Signed subscription agreement for pool: 12324565 tranche: 0xacbdefghijklmn`], {
            paymentInfo: selectedAccount.address,
          })
        )
        // @ts-expect-error
        const txFee = paymentInfo.partialFee.toDecimal()
        setExpectedTxFee(txFee)
      }
    }
    executePaymentInfo()
  }, [])

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

  return connectedType === 'evm'
    ? { execute: signEvmRemark, isLoading: isEvmTxLoading }
    : { execute: signSubstrateRemark, isLoading: isSubstrateTxLoading }
}
