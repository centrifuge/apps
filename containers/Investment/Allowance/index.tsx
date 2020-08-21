import * as React from 'react'
import { Box, FormField, Button, Heading } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { TrancheType } from '../../../services/tinlake/actions'
import { baseToDisplay, displayToBase, Investor, Tranche } from 'tinlake'
import { loadInvestor } from '../../../ducks/investments'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'
import { createTransaction, useTransactionState, TransactionProps } from '../../../ducks/transactions'

interface Props extends TransactionProps {
  investor: Investor
  tinlake: any
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>
  tranche: Tranche
  ensureAuthed?: () => Promise<void>
}

const InvestorAllowance: React.FC<Props> = (props: Props) => {
  const [supplyAmount, setSupplyAmount] = React.useState('0')
  const [redeemAmount, setRedeemAmount] = React.useState('0')
  const [currentSupplyLimit, setCurrentSupplyLimit] = React.useState('0')
  const [currentRedeemLimit, setCurrentRedeemLimit] = React.useState('0')

  const updateLimits = () => {
    const trancheType = props.tranche.type as TrancheType
    const tranche = props.investor[trancheType]
    if (
      (tranche.maxSupply && currentSupplyLimit !== tranche.maxSupply.toString()) ||
      (tranche.maxRedeem && currentRedeemLimit !== tranche.maxRedeem.toString())
    ) {
      setCurrentSupplyLimit((tranche.maxSupply && tranche.maxSupply.toString()) || '0')
      setCurrentRedeemLimit((tranche.maxRedeem && tranche.maxRedeem.toString()) || '0')
      setSupplyAmount((tranche.maxSupply && tranche.maxSupply.toString()) || '0')
      setRedeemAmount((tranche.maxRedeem && tranche.maxRedeem.toString()) || '0')
    }
  }

  React.useEffect(() => updateLimits(), [props])

  const [status, result, setTxId] = useTransactionState()

  const setAllowance = async () => {
    await props.ensureAuthed!()
    updateLimits()
    const trancheType = props.tranche.type as TrancheType

    const txId = await props.createTransaction(
      `Set allowance ${props.investor.address.substring(0, 8)}...`,
      'setAllowance',
      [props.tinlake, props.investor.address, supplyAmount, redeemAmount, trancheType]
    )
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      props.loadInvestor && props.loadInvestor(props.tinlake, props.investor.address)
    }
  }, [result])

  return (
    <Box>
      <Box gap="medium" align="start" margin={{ bottom: 'medium' }}>
        <Heading level="4" margin="none">
          {' '}
          Set allowance{' '}
        </Heading>
      </Box>
      <Box gap="medium" direction="row" margin={{ right: 'large' }}>
        <Box basis={'1/3'}>
          <FormField label="Max investment amount">
            <NumberInput
              value={baseToDisplay(supplyAmount, 18)}
              suffix=" DAI"
              precision={18}
              onValueChange={({ value }) => setSupplyAmount(displayToBase(value, 18))}
              disabled={status === 'unconfirmed' || status === 'pending'}
            />
          </FormField>
        </Box>
        <Box basis={'1/3'}>
          <FormField label="Max redeem amount">
            <NumberInput
              value={baseToDisplay(redeemAmount, 18)}
              suffix={` ${props.tranche.token}`}
              precision={18}
              onValueChange={({ value }) => setRedeemAmount(displayToBase(value, 18))}
              disabled={status === 'unconfirmed' || status === 'pending'}
            />
          </FormField>
        </Box>
        <Box>
          <Button
            onClick={setAllowance}
            primary
            label="Set Allowance"
            disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadInvestor, createTransaction, ensureAuthed })(InvestorAllowance)
