import * as React from 'react'
import { AuthState } from '../../../ducks/auth'
import { Box, Heading } from 'grommet'
import Alert from '../../../components/Alert'
import InvestorSupply from '../Supply'
import InvestorRedeem from '../Redeem'
import InvestorAllowance from '../Allowance'
import TrancheMetric from '../../../components/Investment/TrancheMetric'
import { Investor } from 'tinlake'
import { TrancheType } from '../../../services/tinlake/actions'

interface Props {
  tinlake: any
  auth: AuthState
  investor: Investor
  // todo: extedn tranchetype by tokendat
  tranche: any
}

const TrancheView: React.FC<Props> = (props: Props) => {
  const isAdmin =
    (props.tranche.type === 'junior' && props.auth.permissions?.canSetInvestorAllowanceJunior) ||
    (props.tranche.type === 'senior' && props.auth.permissions?.canSetInvestorAllowanceSenior)
  const isInvestor = props.investor && props.auth.address?.toLowerCase() === props.investor.address.toLowerCase()

  return (
    <Box>
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
