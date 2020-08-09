import * as React from 'react'
import { Box, FormField, Button, Heading } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { TrancheType, setAllowance as setAllowanceAction } from '../../../services/tinlake/actions'
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions'
import { baseToDisplay, displayToBase, Investor, Tranche } from 'tinlake'
import { loadInvestor } from '../../../ducks/investments'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../../ducks/auth'

interface Props {
  investor: Investor
  tinlake: any
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>
  transactionSubmitted?: (loadingMessage: string) => Promise<void>
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>
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

  const setAllowance = async () => {
    props.transactionSubmitted &&
      props.transactionSubmitted(
        'Allowance initiated. Please confirm the pending transactions. Processing may take a few seconds.'
      )
    try {
      await props.ensureAuthed!()
      updateLimits()
      const trancheType = props.tranche.type as TrancheType
      const res = await setAllowanceAction(
        props.tinlake,
        props.investor.address,
        supplyAmount,
        redeemAmount,
        trancheType
      )

      if (res && res.errorMsg) {
        props.responseReceived && props.responseReceived(null, `Allowance failed. ${res.errorMsg}`)
        return
      }

      props.responseReceived && props.responseReceived('Allowance successful.', null)
      props.loadInvestor && props.loadInvestor(props.tinlake, props.investor.address)
    } catch (e) {
      props.responseReceived && props.responseReceived(null, `Allowance failed. ${e}`)
      console.error(e)
    }
  }

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
            />
          </FormField>
        </Box>
        <Box>
          <Button onClick={setAllowance} primary label="Set Allowance" />
        </Box>
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadInvestor, transactionSubmitted, responseReceived, ensureAuthed })(
  InvestorAllowance
)
