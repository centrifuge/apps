import { useRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../../components/Alert'
import { Card } from '../../../components/Card'
import { SectionHeading } from '../../../components/Heading'
import { Stack, Wrap } from '../../../components/Layout'
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
const LoanView: React.FC<Props> = (props: Props) => {
  const router = useRouter()

  React.useEffect(() => {
    const { tinlake, loanId, loadLoan, loadProxies } = props
    loanId && loadLoan!(tinlake, loanId)
    loadProxies && loadProxies()
  }, [])

  const { loans, loanId, tinlake, auth } = props
  const { loan, loanState } = loans!

  if (loanState === 'not found') {
    return (
      <Alert margin="medium" type="error">
        Could not find asset {loanId}
      </Alert>
    )
  }

  const hasBorrowerPermissions =
    (loan &&
      auth?.proxies?.map((proxy: string) => proxy.toLowerCase()).includes(loan.ownerOf.toString().toLowerCase())) ||
    'borrower' in router.query

  return (
    <Stack gap="xlarge">
      <LoanData loan={loan!} auth={props.auth} tinlake={tinlake} poolConfig={props.poolConfig} />
      {loan && loan?.status !== 'closed' && hasBorrowerPermissions && (
        <Stack gap="medium">
          <SectionHeading>Finance / Repay</SectionHeading>
          <Card maxWidth={{ medium: 900 }} p="medium">
            <Wrap gap="medium" justifyContent="space-between" alignItems="flex-start">
              <LoanBorrow loan={loan} tinlake={tinlake} poolConfig={props.poolConfig} />
              <LoanRepay loan={loan} tinlake={tinlake} poolConfig={props.poolConfig} />
            </Wrap>
          </Card>
        </Stack>
      )}
      <NftData data={loan?.nft} />
    </Stack>
  )
}

export default connect((state) => state, { loadLoan, loadProxies })(LoanView)
