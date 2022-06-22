import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { LoanList } from '../components/LoanList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { useLoansAcrossPools } from '../utils/useLoans'
import { usePools } from '../utils/usePools'

export const LoansPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Loans />
    </PageWithSideBar>
  )
}

const Loans: React.FC = () => {
  const pools = usePools()
  const managedPoolIds = pools?.filter((p) => true)?.map((p) => p.id)
  const loans = useLoansAcrossPools(managedPoolIds)

  return (
    <Stack gap={5} flex={1}>
      <PageHeader title="Assets" />
      {loans && <LoanList loans={loans} />}
    </Stack>
  )
}
