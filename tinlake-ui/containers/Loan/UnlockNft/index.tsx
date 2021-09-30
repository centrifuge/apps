import { Box, Button } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { useDebugFlags } from '../../../components/DebugFlags'
import { useTinlake } from '../../../components/TinlakeProvider'
import { ensureAuthed, useAuth } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { useAsset } from '../../../utils/useAsset'

interface Props extends TransactionProps {
  assetId: string
  ensureAuthed: () => Promise<void>
}

const UnlockNft: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const auth = useAuth()
  const [closeStatus, , setCloseTxId] = useTransactionState()

  const { data: asset, refetch } = useAsset(props.assetId)
  const { showBorrower } = useDebugFlags()

  const hasBorrowerPermissions =
    (asset &&
      auth.proxies?.map((proxy: string) => proxy.toLowerCase()).includes(asset.ownerOf.toString().toLowerCase())) ||
    showBorrower

  const close = async () => {
    if (!asset) return
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Close Asset ${asset.loanId}`, 'close', [tinlake, asset])
    setCloseTxId(txId)
  }

  React.useEffect(() => {
    if (closeStatus === 'succeeded') {
      refetch()
    }
  }, [closeStatus])

  return (
    <Box>
      {hasBorrowerPermissions && asset?.status === 'NFT locked' && (
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
