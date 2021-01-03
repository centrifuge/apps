import { Box, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../../components/Alert'
import LoanData from '../../../components/Loan/Data'
import NftData from '../../../components/NftData'
import { Pool } from '../../../config'
import { AuthState, loadProxies } from '../../../ducks/auth'
import { loadLoan, LoansState } from '../../../ducks/loans'
import { TransactionState } from '../../../ducks/transactions'
import LoanBorrow from '../Borrow'
import LoanRepay from '../Repay'

interface Props {
  tinlake: any
  loanId?: string
  loans?: LoansState
  poolConfig: Pool
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>
  auth?: AuthState
  transactions?: TransactionState
  loadProxies?: () => Promise<void>
}

// on state change tokenId --> load nft data for asset collateral
class LoanView extends React.Component<Props> {
  componentDidMount() {
    const { tinlake, loanId, loadLoan, loadProxies } = this.props
    loanId && loadLoan!(tinlake, loanId)
    loadProxies && loadProxies()
  }

  render() {
    const { loans, loanId, tinlake, auth } = this.props
    const { loan, loanState } = loans!
    // if (loanState === null || loanState === 'loading') {
    //   return <Spinner height={'300px'} message={'Loading...'} />
    // }
    if (loanState === 'not found') {
      return (
        <Alert margin="medium" type="error">
          Could not find asset {loanId}
        </Alert>
      )
    }

    const hasBorrowerPermissions = true
    // loan && auth?.proxies?.map((proxy: string) => proxy.toLowerCase()).includes(loan.ownerOf.toString().toLowerCase())

    return (
      <Box>
        <LoanData loan={loan!} auth={this.props.auth} tinlake={tinlake} />
        {loan?.status !== 'closed' && (
          <Box>
            {loan && hasBorrowerPermissions && (
              <>
                <Heading level="5" margin={{ top: 'large', bottom: 'medium' }}>
                  Finance / Repay{' '}
                </Heading>
                <Box
                  width="80%"
                  justify="between"
                  gap="medium"
                  pad="medium"
                  elevation="small"
                  round="xsmall"
                  background="white"
                  direction="row"
                >
                  <LoanBorrow loan={loan!} tinlake={tinlake} />
                  <LoanRepay loan={loan!} tinlake={tinlake} />
                </Box>
              </>
            )}
          </Box>
        )}
        <NftData data={loan?.nft} />
      </Box>
    )
  }
}

export default connect((state) => state, { loadLoan, loadProxies })(LoanView)
