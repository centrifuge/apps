import * as React from 'react'
import { Box, Button, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import { createTransaction, useTransactionState, TransactionProps } from '../../../../ducks/transactions'
import { connect } from 'react-redux'

import { Description } from './styles'
import { Card } from './TrancheOverview'

interface Props extends TransactionProps {
  pool: Pool
  tranche: 'senior' | 'junior'
  setCard: (card: Card) => void
  disbursements: any
  tinlake: any
  updateTrancheData: () => void
}

const CollectCard: React.FC<Props> = (props: Props) => {
  const type = props.disbursements.payoutCurrencyAmount.isZero() ? 'Invest' : 'Redeem'
  const token = type === 'Invest' ? (props.tranche === 'senior' ? 'DROP' : 'TIN') : 'DAI'

  const [status, , setTxId] = useTransactionState()

  const collect = async () => {
    const method = props.tranche === 'senior' ? 'disburseSenior' : 'disburseJunior'
    const txId = await props.createTransaction(`Collect ${token}`, method, [props.tinlake])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.updateTrancheData()
    }
  }, [status])

  const disabled = status === 'unconfirmed' || status === 'pending'

  return (
    <Box>
      <Heading level="6" margin={{ bottom: 'xsmall' }}>
        {token} available for collection
      </Heading>
      <Description>
        Your {token} {type.toLowerCase()} order has been executed.
      </Description>

      <Table margin={{ top: 'medium' }}>
        <TableBody>
          <TableRow>
            <TableCell scope="row">Type of transaction</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {type} {token}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell scope="row">Order amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>12.333,00</TableCell>
          </TableRow> */}
          <TableRow>
            <TableCell scope="row">Settled amount</TableCell>
            <TableCell style={{ textAlign: 'end' }}>
              {addThousandsSeparators(
                toPrecision(
                  baseToDisplay(
                    props.disbursements.payoutTokenAmount.isZero()
                      ? props.disbursements.payoutCurrencyAmount
                      : props.disbursements.payoutTokenAmount,
                    18
                  ),
                  2
                )
              )}
            </TableCell>
          </TableRow>
          {/* <TableRow>
            <TableCell scope="row">Settled token price</TableCell>
            <TableCell style={{ textAlign: 'end' }}>1.232</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Transaction value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>1321,523.00 DAI</TableCell>
          </TableRow> */}
        </TableBody>
      </Table>

      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button primary label="Collect" onClick={collect} disabled={disabled} />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(CollectCard)
