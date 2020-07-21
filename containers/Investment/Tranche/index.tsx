import * as React from 'react'
import { AuthState } from '../../../ducks/auth'
import { Box, Heading } from 'grommet'
import Alert from '../../../components/Alert'
import { Spinner } from '@centrifuge/axis-spinner'
import InvestorSupply from '../Supply'
import InvestorRedeem from '../Redeem'
import InvestorAllowance from '../Allowance'
import TrancheMetric from '../../../components/Investment/TrancheMetric'
import { TransactionState } from '../../../ducks/transactions'
import { Investor } from 'tinlake'
import { TrancheType } from '../../../services/tinlake/actions'

interface Props {
  tinlake: any
  auth: AuthState
  investor: Investor
  transactions?: TransactionState
  resetTransactionState?: () => void
  // todo: extedn tranchetype by tokendat
  tranche: any
}

class TrancheView extends React.Component<Props> {
  render() {
    const { auth, investor, transactions, tranche, tinlake } = this.props
    const isAdmin =
      (tranche.type === 'junior' && auth.permissions?.canSetInvestorAllowanceJunior) ||
      (tranche.type === 'senior' && auth.permissions?.canSetInvestorAllowanceSenior)
    const isInvestor = investor && auth.address?.toLowerCase() === investor.address.toLowerCase()
    if (transactions && transactions.transactionState && transactions.transactionState === 'processing') {
      return (
        <Spinner
          height={'calc(100vh - 89px - 84px)'}
          message={transactions.loadingMessage || 'Processing Transaction. This may take a fev seconds. Please wait...'}
        />
      )
    }

    return (
      <Box>
        {transactions && transactions.successMessage && (
          <Box margin={{ top: 'medium' }}>
            <Alert type="success">{transactions.successMessage} </Alert>
          </Box>
        )}

        {transactions && transactions.errorMessage && (
          <Box margin={{ top: 'medium' }}>
            <Alert type="error">{transactions.errorMessage}</Alert>
          </Box>
        )}

        {investor && tranche && (
          <Box>
            <Box margin={{ top: 'medium', bottom: 'large' }}>
              <Box>
                <TrancheMetric
                  tokenData={tranche.tokenData}
                  investor={investor}
                  type={(tranche.type as any) as TrancheType}
                />
              </Box>
            </Box>

            {isAdmin && (
              <Box margin={{ top: 'medium', bottom: 'large' }}>
                <Box>
                  <InvestorAllowance tranche={tranche} tinlake={tinlake} investor={investor} />
                </Box>
              </Box>
            )}

            {isInvestor && (
              <Box margin={{ top: 'medium', bottom: 'large' }}>
                <Box gap="medium" align="start" margin={{ bottom: 'medium' }}>
                  <Heading level="4" margin="none">
                    Invest / Redeem{' '}
                  </Heading>
                </Box>

                <Box direction="row">
                  <InvestorSupply
                    trancheType={(tranche.type as any) as TrancheType}
                    investor={investor!}
                    tinlake={tinlake}
                  />
                  <InvestorRedeem tranche={tranche} investor={investor!} tinlake={tinlake} />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }
}

export default TrancheView
