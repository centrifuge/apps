import { Box, Button, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { Card } from '../../../components/Card'
import { SectionHeading } from '../../../components/Heading'
import { Stack } from '../../../components/Layout'
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
    props.loan.rateGroup !== undefined &&
    props.loan.writeOffRateGroupStart !== undefined &&
    props.loan.rateGroup >= props.loan.writeOffRateGroupStart

  const isOverdue =
    props.loan.currentValidWriteOffGroup !== undefined &&
    props.loan.currentValidWriteOffGroup < 100000 &&
    props.loan.maturityDate &&
    props.loan.maturityDate > Date.now()

  const canBeWrittenOff =
    props.loan.rateGroup !== undefined &&
    props.loan.currentValidWriteOffGroup !== undefined &&
    props.loan.writeOffRateGroupStart !== undefined &&
    props.loan.currentValidWriteOffGroup !== props.loan.rateGroup - props.loan.writeOffRateGroupStart

  return props.loan.rateGroup !== undefined &&
    props.loan.writeOffRateGroupStart !== undefined &&
    props.loan.currentValidWriteOffGroup !== undefined &&
    isOverdue === true ? (
    <Stack gap="medium">
      <SectionHeading>Write-off</SectionHeading>
      <Card maxWidth={{ medium: 900 }} p="medium">
        <Box width="360px" gap="medium">
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
              {isOverdue === true && (
                <TableRow>
                  <TableCell scope="row">Write-off group according to schedule</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{props.loan.currentValidWriteOffGroup}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Box align="start">
            <Box direction="row" gap="small">
              <Button primary label="Default Write-off" onClick={writeOff} disabled={!canBeWrittenOff} />
              {/* <Button secondary label="Override Write-off" disabled={true} /> */}
            </Box>
          </Box>
        </Box>
      </Card>
    </Stack>
  ) : null
}

export default connect(null, { createTransaction, ensureAuthed })(LoanWriteOff)
