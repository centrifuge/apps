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

const TrancheView: React.FC<Props> = (props: Props) => {
  const [errorMsg, setErrorMsg] = React.useState<string | undefined>(undefined)

  const isAdmin =
    (props.tranche.type === 'junior' && props.auth.permissions?.canSetInvestorAllowanceJunior) ||
    (props.tranche.type === 'senior' && props.auth.permissions?.canSetInvestorAllowanceSenior)
  const isInvestor = props.investor && props.auth.address?.toLowerCase() === props.investor.address.toLowerCase()
  if (
    props.transactions &&
    props.transactions.transactionState &&
    props.transactions.transactionState === 'processing'
  ) {
    return (
      <Spinner
        height={'calc(100vh - 89px - 84px)'}
        message={
          props.transactions.loadingMessage || 'Processing Transaction. This may take a few seconds. Please wait...'
        }
      />
    )
  }

  return (
    <Box>
      {props.transactions && props.transactions.successMessage && (
        <Box margin={{ top: 'medium' }}>
          <Alert type="success">{props.transactions.successMessage} </Alert>
        </Box>
      )}

      {props.transactions && props.transactions.errorMessage && (
        <Box margin={{ top: 'medium' }}>
          <Alert type="error">{props.transactions.errorMessage}</Alert>
        </Box>
      )}

      {errorMsg && (
        <Box margin={{ top: 'medium' }}>
          <Alert type="error">{errorMsg}</Alert>
        </Box>
      )}

      {props.investor && props.tranche && (
        <Box>
          <Box margin={{ top: 'medium', bottom: 'large' }}>
            <Box>
              <TrancheMetric
                tokenData={props.tranche.tokenData}
                investor={props.investor}
                type={(props.tranche.type as any) as TrancheType}
              />
            </Box>
          </Box>

          {isAdmin && (
            <Box margin={{ top: 'medium', bottom: 'large' }}>
              <Box>
                <InvestorAllowance tranche={props.tranche} tinlake={props.tinlake} investor={props.investor} />
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
                  trancheType={(props.tranche.type as any) as TrancheType}
                  investor={props.investor!}
                  tinlake={props.tinlake}
                  setErrorMsg={setErrorMsg}
                />
                <InvestorRedeem tranche={props.tranche} investor={props.investor!} tinlake={props.tinlake} />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default TrancheView
