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
import { TransactionState } from '../../../ducks/transactions'
import { useAsset } from '../../../utils/useAsset'
import LoanBorrow from '../Borrow'
import LoanRepay from '../Repay'

interface Props {
  tinlake: any
  loanId: string
  poolConfig: Pool
  auth?: AuthState
  transactions?: TransactionState
  loadProxies?: () => Promise<void>
}

// on state change tokenId --> load nft data for asset collateral
const LoanView: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const {
    data: assetData,
    refetch: refetchAsset,
    error,
  } = useAsset(props.tinlake.contractAddresses.ROOT_CONTRACT, props.loanId)

  React.useEffect(() => {
    const { loadProxies } = props
    loadProxies && loadProxies()
  }, [])

  const { loanId, tinlake, auth } = props

  if (error) {
    return (
      <Alert margin="medium" type="error">
        Could not find asset {loanId}
      </Alert>
    )
  }

  const hasBorrowerPermissions =
    (assetData &&
      auth?.proxies
        ?.map((proxy: string) => proxy.toLowerCase())
        .includes(assetData.ownerOf.toString().toLowerCase())) ||
    'borrower' in router.query

  return (
    <Stack gap="xlarge">
      <LoanData loan={assetData} tinlake={tinlake} poolConfig={props.poolConfig} />
      {assetData && assetData.status !== 'closed' && hasBorrowerPermissions && (
        <Stack gap="medium">
          <SectionHeading>Finance / Repay</SectionHeading>
          <Card maxWidth={{ medium: 900 }} p="medium">
            <Wrap gap="medium" justifyContent="space-between" alignItems="flex-start">
              <LoanBorrow loan={assetData} refetch={refetchAsset} tinlake={tinlake} poolConfig={props.poolConfig} />
              <LoanRepay loan={assetData} refetch={refetchAsset} tinlake={tinlake} poolConfig={props.poolConfig} />
            </Wrap>
          </Card>
        </Stack>
      )}
      <NftData data={assetData?.nft} />
    </Stack>
  )
}

export default connect((state) => state, { loadProxies })(LoanView)
