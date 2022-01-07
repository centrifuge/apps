import { Button, IconArrowRight, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LabelValueStack } from '../components/LabelValueStack'
import LoanLabel from '../components/LoanLabel'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useLoan } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const LoanPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Loan />
    </PageWithSideBar>
  )
}

const Loan: React.FC = () => {
  const { pid, aid } = useParams<{ pid: string; aid: string }>()
  const { data: pool } = usePool(pid)
  const { data: loan } = useLoan(pid, aid)
  const { data: poolMetadata } = usePoolMetadata(pool)

  return (
    <Stack gap={3} flex={1}>
      <PageHeader
        title="Asset"
        titleAddition={loan && <LoanLabel loan={loan} />}
        parent={{ to: `/pools/${pid}/assets`, label: 'Assets' }}
        subtitle="[Florida real estate loan]"
        subtitleLink={{ label: poolMetadata?.metadata?.name ?? '', to: `/pools/${pid}` }}
        actions={
          <>
            <Button variant="text" small icon={IconArrowRight}>
              Finance
            </Button>
            <Button variant="text" small icon={IconArrowRight}>
              Repay
            </Button>
            <Button variant="text" small icon={IconArrowRight}>
              Write off
            </Button>
          </>
        }
      />
      <PageSummary>
        <LabelValueStack label="Loan type" value="Todo" />
        <LabelValueStack label="Total borrowed amount" value="Todo" />
        <LabelValueStack label="Current debt" value="Todo" />
      </PageSummary>
      {loan ? (
        <>
          <Text>{loan.id}</Text>
        </>
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            Asset not found
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
