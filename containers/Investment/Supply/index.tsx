import * as React from 'react'
import { Box, FormField, Button, Text } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { TrancheType } from '../../../services/tinlake/actions'
import { baseToDisplay, displayToBase, Investor } from 'tinlake'
import { loadInvestor } from '../../../ducks/investments'
import { loadPool } from '../../../ducks/pool'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'
import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'

interface Props extends TransactionProps {
  investor: Investor
  tinlake: any
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  trancheType: TrancheType
  ensureAuthed?: () => Promise<void>
}

const InvestorSupply: React.FC<Props> = (props: Props) => {
  const [supplyAmount, setSupplyAmount] = React.useState('0')

  const [status, result, setTxId] = useTransactionState()

  const supply = async () => {
    await ensureAuthed!()

    const valueToDecimal = new Decimal(baseToDisplay(supplyAmount, 18)).toFixed(2)
    const formatted = addThousandsSeparators(valueToDecimal.toString())
    const tokenSymbol = props.trancheType === 'senior' ? 'DROP' : 'TIN'

    const txId = await props.createTransaction(`${tokenSymbol} Invest ${formatted} DAI`, 'supply', [
      props.tinlake,
      supplyAmount,
      props.trancheType,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      loadInvestor && loadInvestor(props.tinlake, props.investor.address)
      loadPool && loadPool(props.tinlake)
    }
  }, [status, result])

  const trancheValues = props.investor[props.trancheType]
  const maxSupplyAmount = trancheValues.maxSupply || '0'
  const maxSupplyOverflow = new BN(supplyAmount).cmp(new BN(maxSupplyAmount)) > 0
  const canSupply =
    maxSupplyAmount.toString() !== '0' && !maxSupplyOverflow && !(status === 'unconfirmed' || status === 'pending')

  return (
    <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Investment amount">
          <NumberInput
            value={baseToDisplay(supplyAmount, 18)}
            suffix=" DAI"
            precision={18}
            onValueChange={({ value }) => setSupplyAmount(displayToBase(value, 18))}
            disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={supply} primary label="Invest" disabled={!canSupply} />
        {maxSupplyOverflow && (
          <Box margin={{ top: 'small' }}>
            Max investment amount exceeded. <br />
            Amount has to be lower then <br />
            <Text weight="bold">{`${maxSupplyAmount.toString()}`}</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default connect((state) => state, {
  loadInvestor,
  loadPool,
  createTransaction,
  ensureAuthed,
})(InvestorSupply)
