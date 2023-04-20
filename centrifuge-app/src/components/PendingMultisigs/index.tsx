import { ComputedMultisig, computeMultisig, PendingMultisigData } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Dialog, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useSuitableAccounts } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'

export function PendingMultisigs({ poolId }: { poolId: string }) {
  const [multisigDialogOpen, setMultisigDialogOpen] = React.useState(false)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const ctx = useWallet()

  const multisig = metadata?.adminMultisig && computeMultisig(metadata.adminMultisig)
  // const multisig = computeMultisig({
  //   signers: ['kAMN6eYXWjYWzvsRYkVw8aJuW5ADjA3Hd2zgL6vbmM72U1Jcu', 'kAKbmHS8q5ceJHQgfAGwYtuhTTNxEAra5WRtsPnai1jSeNoUD'],
  //   threshold: 2,
  // })
  const multiAddress = multisig?.address
  const [account] = useSuitableAccounts({ actingAddress: [multiAddress || ''] })

  console.log('multiAddress', multiAddress)

  const [pendingMultisigs] = useCentrifugeQuery(
    ['pendingMultisig', multiAddress],
    (cent) => cent.multisig.getPendingTransactions([multiAddress!]),
    {
      enabled: !!multiAddress,
    }
  )

  return (
    <>
      {account && multisig && pendingMultisigs && pendingMultisigs?.length > 0 && (
        <>
          <MultisigDialog open={multisigDialogOpen} onClose={() => setMultisigDialogOpen(false)} multisig={multisig} />
          <Button onClick={() => setMultisigDialogOpen(true)} variant="secondary">
            View {pendingMultisigs.length} pending multisig approval{pendingMultisigs.length > 0 && 's'}
          </Button>
        </>
      )}
    </>
  )
}

function MultisigDialog({
  open,
  onClose,
  multisig,
}: {
  open: boolean
  onClose: () => void
  multisig: ComputedMultisig
}) {
  const [pendingMultisigs] = useCentrifugeQuery(['pendingMultisig', multisig.address], (cent) =>
    cent.multisig.getPendingTransactions([multisig.address])
  )
  return (
    <Dialog isOpen={open} onClose={onClose}>
      <Stack gap={3}>
        <>
          <Text variant="heading2" as="h2">
            Pending Multisig Approvals
          </Text>
          {pendingMultisigs?.map((data) => (
            <PendingMultisig data={data} multisig={multisig} />
          ))}
        </>
      </Stack>
    </Dialog>
  )
}

function PendingMultisig({ data, multisig }: { data: PendingMultisigData; multisig: ComputedMultisig }) {
  const { substrate } = useWallet()
  const { execute: doTransaction, isLoading: transactionIsPending } = useCentrifugeTransaction(
    'Approve or cancel',
    (cent) => cent.multisig.approveOrCancel
  )
  console.log('data.call?.toHuman()', data.call?.toHuman(), data.callData)
  return (
    <Stack gap={2}>
      {data.hash}
      {data.name}
      <Shelf>
        {data.info.approvals.includes(substrate.selectedAccount!.address) ? (
          <Button disabled={transactionIsPending} onClick={() => doTransaction([data.hash, multisig, undefined, true])}>
            Cancel
          </Button>
        ) : (
          <Button disabled={transactionIsPending} onClick={() => doTransaction([data.hash, multisig])}>
            Approve
          </Button>
        )}
      </Shelf>
    </Stack>
  )
}
