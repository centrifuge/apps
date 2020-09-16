import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { connect } from 'react-redux'

interface Props extends TransactionProps {
  tinlake: ITinlakeV3
}

const EpochOverview: React.FC<Props> = (props: Props) => {
  const [epochId, setEpochId] = React.useState(0)
  // const [epochMinimumTimeEnd, setEpochMinimumTimeEnd] = React.useState(0)
  const [epochState, setEpochState] = React.useState('')

  // const endHoursFromNow = Math.floor((epochMinimumTimeEnd - new Date().getTime()) / 1000 / 60 / 60)

  React.useEffect(() => {
    async function getState() {
      setEpochId(await props.tinlake.getCurrentEpochId())
      // setEpochMinimumTimeEnd(await props.tinlake.getCurrentEpochMinimumTimeEnd())
      setEpochState(await props.tinlake.getCurrentEpochState())
    }

    getState()
  }, [])

  const [status, , setTxId] = useTransactionState()

  const solve = async () => {
    const txId = await props.createTransaction(`Run solver`, 'solveEpoch', [props.tinlake])
    setTxId(txId)
  }

  const execute = async () => {
    await props.createTransaction(`Execute epoch`, 'executeEpoch', [props.tinlake])
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
            <TableCell style={{ textAlign: 'end' }}>{epochId}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Epoch state</TableCell>
            <TableCell style={{ textAlign: 'end' }}>{epochState}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
        {epochState === 'can-be-closed' && (
          <Button label="Close &amp; Solve Epoch" onClick={() => solve()} disabled={disabled} />
        )}
        {epochState === 'challenge-period-ended' && (
          <Button label="Execute orders" onClick={() => execute()} disabled={disabled} />
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(EpochOverview)
