import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { Asset } from '../../../utils/useAsset'

type MinimalAsset = Pick<Asset, 'loanId' | 'ownerOf' | 'status'>

interface Props extends TransactionProps {
  asset: MinimalAsset
  refetch: () => void
  tinlake: ITinlake
  ensureAuthed: () => Promise<void>
}

const UnlockNft: React.FC<Props> = (props: Props) => {
  const [closeStatus, , setCloseTxId] = useTransactionState()

  const close = async () => {
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Close Asset ${props.asset.loanId}`, 'close', [
      props.tinlake,
      props.asset,
    ])
    setCloseTxId(txId)
  }

  React.useEffect(() => {
    if (closeStatus === 'succeeded') {
      props.refetch()
    }
  }, [closeStatus])

  return (
    <Box>
      {props.asset.status! === 'NFT locked' && (
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
