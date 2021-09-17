import { Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { Asset } from '../../../utils/useAsset'

interface Props extends TransactionProps {
  loan: Asset
  refetch: () => void
  poolConfig: Pool
  ensureAuthed?: () => Promise<void>
}

const LoanWriteOff: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()

  const [writeOffStatus, , setWriteOffTxId] = useTransactionState()

  const writeOff = async () => {
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Write-off Asset ${props.loan.loanId}`, 'writeOff', [
      tinlake,
      Number(props.loan.loanId),
    ])
    setWriteOffTxId(txId)
  }

  React.useEffect(() => {
    if (writeOffStatus === 'succeeded') {
      props.refetch()
    }
  }, [writeOffStatus])

  const isWrittenOff =
    props.loan.rateGroup &&
    props.loan.writeOffRateGroupStart &&
    props.loan.rateGroup > props.loan.writeOffRateGroupStart

  const isOverdue = props.loan.maturityDate && props.loan.maturityDate > Date.now()

  return (
    <Box width="360px" gap="medium">
      {props.loan.rateGroup !== undefined &&
        props.loan.writeOffRateGroupStart !== undefined &&
        props.loan.currentValidWriteOffGroup !== undefined && (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Current rate group</TableCell>
                <TableCell style={{ textAlign: 'end' }}>{props.loan.rateGroup}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Current write-off group</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  {isWrittenOff ? props.loan.rateGroup - props.loan.writeOffRateGroupStart : 'None'}
                </TableCell>
              </TableRow>
              {isOverdue && (
                <TableRow>
                  <TableCell scope="row">Write-off group according to schedule</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    {props.loan.writeOffRateGroupStart + props.loan.currentValidWriteOffGroup}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      <Box align="start">
        <Box direction="row" gap="small">
          <Button primary label="Default Write-off" onClick={writeOff} disabled={!isOverdue} />
          {/* <Button secondary label="Override Write-off" disabled={true} /> */}
        </Box>
      </Box>
    </Box>
  )
}

export default connect(null, { createTransaction, ensureAuthed })(LoanWriteOff)
