import * as React from 'react'
import { Box, FormField, Button, Text } from 'grommet'
import NumberInput from '../../../components/NumberInput'
import { redeem, TrancheType } from '../../../services/tinlake/actions'
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions'
import { baseToDisplay, displayToBase, Investor, Tranche } from 'tinlake'
import { loadInvestor } from '../../../ducks/investments'
import { loadPool } from '../../../ducks/pool'
import { connect } from 'react-redux'
import BN from 'bn.js'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { ensureAuthed } from '../../../ducks/auth'

interface Props {
  investor: Investor
  tinlake: any
  loadInvestor?: (tinlake: any, address: string, refresh?: boolean) => Promise<void>
  loadPool?: (tinlake: any) => Promise<void>
  transactionSubmitted?: (loadingMessage: string) => Promise<void>
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>
  tranche: Tranche
  ensureAuthed?: () => Promise<void>
}

interface State {
  redeemAmount: string
}

class InvestorRedeem extends React.Component<Props, State> {
  state: State = {
    redeemAmount: '0',
  }

  redeem = async () => {
    const {
      tranche,
      transactionSubmitted,
      responseReceived,
      loadInvestor,
      loadPool,
      investor,
      tinlake,
      ensureAuthed,
    } = this.props
    const { redeemAmount } = this.state
    transactionSubmitted &&
      transactionSubmitted(
        'Redeem initiated. Please confirm the pending transactions. ' + 'Processing may take a few seconds.'
      )
    try {
      await ensureAuthed!()
      const res = await redeem(tinlake, redeemAmount, (tranche.type as any) as TrancheType)
      if (res && res.errorMsg) {
        responseReceived && responseReceived(null, `Redeem failed. ${res.errorMsg}`)
        return
      }
      responseReceived && responseReceived('Redeem successful. Please check your wallet.', null)
      loadInvestor && loadInvestor(tinlake, investor.address)
      loadPool && loadPool(tinlake)
    } catch (e) {
      responseReceived && responseReceived(null, `Redeem failed. ${e}`)
      console.error(e)
    }
  }

  render() {
    const { investor, tranche } = this.props
    const { redeemAmount } = this.state
    const trancheValues = investor[(tranche.type as any) as TrancheType]
    const maxRedeemAmount = trancheValues.maxRedeem || '0'
    const tokenBalance = trancheValues.tokenBalance || '0'
    const redeemLimitSet = maxRedeemAmount.toString() !== '0'
    const limitOverflow = new BN(redeemAmount).cmp(new BN(maxRedeemAmount)) > 0
    const availableTokensOverflow = new BN(redeemAmount).cmp(new BN(tokenBalance)) > 0
    const redeemEnabled = redeemLimitSet && !limitOverflow && !availableTokensOverflow

    return (
      <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
        <Box gap="medium">
          <FormField label="Redeem amount">
            <NumberInput
              value={baseToDisplay(redeemAmount, 18)}
              suffix={` ${tranche.token}`}
              precision={18}
              onValueChange={({ value }) => this.setState({ redeemAmount: displayToBase(value, 18) })}
            />
          </FormField>
        </Box>
        <Box align="start">
          <Button onClick={this.redeem} primary label="Redeem" disabled={!redeemEnabled} />

          {limitOverflow && !availableTokensOverflow && (
            <Box margin={{ top: 'small' }}>
              Max redeem amount exceeded. <br />
              Amount has to be lower then <br />
              <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(maxRedeemAmount, 18))}`}</Text>
            </Box>
          )}

          {availableTokensOverflow && (
            <Box margin={{ top: 'small' }}>
              Available token amount exceeded. <br />
              Amount has to be lower then <br />
              <Text weight="bold">{`${addThousandsSeparators(baseToDisplay(tokenBalance, 18))}`}</Text>
            </Box>
          )}
        </Box>
      </Box>
    )
  }
}

export default connect((state) => state, {
  loadInvestor,
  loadPool,
  transactionSubmitted,
  responseReceived,
  ensureAuthed,
})(InvestorRedeem)
