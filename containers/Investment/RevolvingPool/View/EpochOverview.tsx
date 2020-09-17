import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { connect } from 'react-redux'
import { EpochData } from './index'

interface Props extends TransactionProps {
  epochData: EpochData
  tinlake: ITinlakeV3
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Close epoch`, 'solveEpoch', [props.tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    const txId = await props.createTransaction(`Execute epoch`, 'executeEpoch', [props.tinlake])
    setTxId(txId)
  }

  const disabled = status === 'unconfirmed' || status === 'pending'

  return (
    <Box width="420px" pad="medium" margin={{ bottom: 'medium' }}>
      <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
        <Heading level="5" margin={'0'}>
          Current Epoch
        </Heading>
      </Box>

      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Epoch #</TableCell>
            <TableCell style={{ textAlign: 'end' }}>{props.epochData.id}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
        {props.epochData.state === 'can-be-closed' && (
          <Button label="Close epoch" onClick={solve} disabled={disabled} />
        )}
        {props.epochData.state === 'challenge-period-ended' && (
          <Button label="Execute orders" onClick={execute} disabled={disabled} />
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(EpochOverview)
