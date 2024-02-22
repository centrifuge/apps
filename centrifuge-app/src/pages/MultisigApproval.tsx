import { computeMultisig } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { Button, Shelf, Text, TextAreaInput } from '@centrifuge/fabric'
import { useLocation } from 'react-router'
import { LayoutBase } from '../components/LayoutBase'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { usePendingMultisigActions } from '../components/PendingMultisigs'
import { truncate } from '../utils/web3'

export default function MultisigApprovalPage() {
  const { search } = useLocation()
  const {
    substrate: { accounts, selectedAddress, selectAccount },
  } = useWallet()
  const params = new URLSearchParams(search)
  const signersParam = params.get('signers')?.split(',')
  const threshold = Number(params.get('threshold'))
  const hash = params.get('hash')
  const possibleCallData = params.get('data') || undefined
  const multisig = signersParam && threshold >= 2 ? computeMultisig({ signers: signersParam, threshold }) : null

  const [pendingMultisig] = useCentrifugeQuery(
    ['pendingMultisig', multisig?.address],
    (cent) => cent.multisig.getPendingTransaction([multisig!.address, hash!]),
    { enabled: !!multisig && !!hash, suspense: true }
  )

  if (!multisig || !hash || !pendingMultisig) throw new Error('Not enough data')

  const {
    approveOrReject,
    isReject,
    callString,
    transactionIsPending,
    callFormInput,
    setCallFormInput,
    callInputError,
    isCallDataNeeded,
  } = usePendingMultisigActions({
    data: pendingMultisig,
    multisig,
    possibleCallData,
  })

  const suitableAccount = accounts?.find((acc) => multisig.signers.includes(acc.address))
  return (
    <LayoutBase>
      <PageHeader
        title="Approve multisig transaction"
        subtitle={`Call hash: ${truncate(hash)}`}
        actions={
          selectedAddress && !multisig.signers.includes(selectedAddress) ? (
            <Shelf gap={2}>
              <Text variant="body2">selected account not signer to multisig</Text>
              {suitableAccount && (
                <Button variant="secondary" onClick={() => selectAccount(suitableAccount.address)}>
                  Switch to {suitableAccount.name}
                </Button>
              )}
            </Shelf>
          ) : (
            <Button onClick={approveOrReject} loading={transactionIsPending}>
              {isReject ? 'Reject' : 'Approve'}
            </Button>
          )
        }
      ></PageHeader>
      <PageSection>
        {isCallDataNeeded && !callString && (
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
            <Text as="summary" variant="heading2">
              Call details
            </Text>
            <Text as="pre" variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
              {callString}
            </Text>
          </details>
        )}
      </PageSection>
    </LayoutBase>
  )
}
