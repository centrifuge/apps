import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import { useTinlake } from '../../../components/TinlakeProvider'
import { AuthState, ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { Asset } from '../../../utils/useAsset'

type MinimalAsset = Pick<Asset, 'loanId' | 'ownerOf' | 'status'>

interface Props extends TransactionProps {
  asset: MinimalAsset
  auth: AuthState
  refetch: () => void
  ensureAuthed: () => Promise<void>
}

const UnlockNft: React.FC<Props> = (props: Props) => {
  const [closeStatus, , setCloseTxId] = useTransactionState()

  const router = useRouter()
  const tinlake = useTinlake()

  const hasBorrowerPermissions =
    (props.asset &&
      props.auth?.proxies
        ?.map((proxy: string) => proxy.toLowerCase())
        .includes(props.asset.ownerOf.toString().toLowerCase())) ||
    'borrower' in router.query

  const close = async () => {
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Close Asset ${props.asset.loanId}`, 'close', [tinlake, props.asset])
    setCloseTxId(txId)
  }

  React.useEffect(() => {
    if (closeStatus === 'succeeded') {
      props.refetch()
    }
  }, [closeStatus])

  return (
    <Box>
      {hasBorrowerPermissions && props.asset.status! === 'NFT locked' && (
        <Button
          onClick={close}
          secondary
          label="Unlock NFT"
          disabled={closeStatus === 'unconfirmed' || closeStatus === 'pending'}
        />
      )}
    </Box>
  )
}

export default connect(null, { createTransaction, ensureAuthed })(UnlockNft)
