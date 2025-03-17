import {
  ComputedMultisig,
  computeMultisig,
  Multisig,
  PendingMultisigData,
  Pool,
  PoolMetadata,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, Dialog, Divider, Stack, Text, TextAreaInput } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'
import { useSuitableAccounts } from '../../utils/usePermissions'

export function PendingMultisigs({ pool }: { pool: Pool & { meta: PoolMetadata } }) {
  const [multisigDialogOpen, setMultisigDialogOpen] = React.useState(false)

  const multisig = pool.meta?.adminMultisig && computeMultisig(pool.meta.adminMultisig)
  const multiAddress = multisig?.address || ''

  const [pendingMultisigs] = useCentrifugeQuery(
    ['pendingMultisig', multiAddress],
    (cent) => cent.multisig.getPendingTransactions([multiAddress!]),
    {
      enabled: !!multiAddress,
    }
  )

  return (
    <>
      {multisig && pendingMultisigs && pendingMultisigs?.length > 0 && (
        <>
          <MultisigDialog
            open={multisigDialogOpen}
            onClose={() => setMultisigDialogOpen(false)}
            multisig={multisig}
            multiAddress={multiAddress}
          />
          <Stack as={Card} p={2} gap={2}>
            <Text>
              {pendingMultisigs.length} pending multisig approval{pendingMultisigs.length > 0 && 's'}
            </Text>
            <Button onClick={() => setMultisigDialogOpen(true)} variant="secondary">
              View
            </Button>
          </Stack>
        </>
      )}
    </>
  )
}

function MultisigDialog({
  open,
  onClose,
  multisig,
  multiAddress,
}: {
  open: boolean
  onClose: () => void
  multisig: ComputedMultisig
  multiAddress: string
}) {
  const [pendingMultisigs] = useCentrifugeQuery(['pendingMultisig', multisig.address], (cent) =>
    cent.multisig.getPendingTransactions([multisig.address])
  )
  return (
    <Dialog isOpen={open} onClose={onClose} title="Pending Multisig Approvals">
      <Stack gap={3}>
        <>
          {pendingMultisigs?.map((data, i) => (
            <>
              {i > 0 && <Divider />}
              <PendingMultisig data={data} multisig={multisig} multiAddress={multiAddress} />
            </>
          ))}
        </>
      </Stack>
    </Dialog>
  )
}

export function PendingMultisig({
  data,
  multisig,
  possibleCallData,
  multiAddress,
}: {
  data: PendingMultisigData
  multisig: Multisig
  possibleCallData?: string
  multiAddress: string
}) {
  const {
    approveOrReject,
    isReject,
    callFormInput,
    callString,
    transactionIsPending,
    setCallFormInput,
    callInputError,
    isCallDataNeeded,
  } = usePendingMultisigActions({
    data,
    multisig,
    possibleCallData,
  })
  const [account] = useSuitableAccounts({ actingAddress: [multiAddress || ''] })

  return (
    <Stack gap={2} alignItems="flex-start">
      <Text style={{ overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Call hash: {data.hash}
      </Text>
      {isReject ? (
        <Button disabled={transactionIsPending} onClick={approveOrReject}>
          Reject
        </Button>
      ) : (
        <>
          {isCallDataNeeded && (
            <>
              <TextAreaInput
                label="Call data"
                placeholder="0x..."
                value={callFormInput}
                onChange={(e) => setCallFormInput(e.target.value)}
              />
              {callInputError && (
                <Text variant="label2" color="statusCritical">
                  Calldata doesn't match hash
                </Text>
              )}
            </>
          )}
          {callString && (
            <details>
              <summary>Call details</summary>
              <Box maxHeight="300px" overflowY="auto">
                <pre style={{ whiteSpace: 'pre-wrap' }}>{callString}</pre>
              </Box>
            </details>
          )}
          <Button disabled={transactionIsPending || !account} onClick={approveOrReject}>
            Approve
          </Button>
        </>
      )}
    </Stack>
  )
}

export function usePendingMultisigActions({
  data,
  multisig,
  possibleCallData,
}: {
  data: PendingMultisigData
  multisig: Multisig
  possibleCallData?: string
}) {
  const address = useAddress('substrate')
  const { execute: doTransaction, isLoading: transactionIsPending } = useCentrifugeTransaction(
    'Approve or cancel',
    (cent) => cent.multisig.approveOrCancel
  )
  const api = useCentrifugeApi()
  const [callFormInput, setCallFormInput] = React.useState('')

  const callDataInput = callFormInput || possibleCallData

  const [callFromInput, inputValid] = React.useMemo(() => {
    if (!callDataInput) return [null, false]
    try {
      const call = api.createType('Call', callDataInput)

      return [call, call.hash.eq(data.hash)]
    } catch {
      return [null, false]
    }
  }, [api, callDataInput, data.hash])

  const call = data.call || (inputValid && callFromInput)

  const callString = React.useMemo(() => {
    if (!call) return ''
    try {
      return JSON.stringify(call.toHuman(), null, 2)
    } catch {
      return ''
    }
  }, [call])

  const isReject = data.info.approvals.includes(address!)
  const isCallDataNeeded = !isReject && !data.callData && !possibleCallData

  return {
    approveOrReject: () =>
      isReject
        ? doTransaction([data.hash, multisig, undefined, true])
        : doTransaction([data.hash, multisig, isCallDataNeeded ? callFormInput : undefined]),
    isReject,
    callString,
    transactionIsPending,
    callFormInput,
    setCallFormInput,
    callInputError: !!callFormInput && !inputValid,
    isCallDataNeeded,
  }
}
