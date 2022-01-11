import { Button, Card, Grid, IconArrowRight, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { LabelValueList } from '../components/LabelValueList'
import { LabelValueStack } from '../components/LabelValueStack'
import LoanLabel from '../components/LoanLabel'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { formatDate } from '../utils/date'
import { useLoan } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'

const e27 = new BN(10).pow(new BN(27))

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
  const centrifuge = useCentrifuge()

  console.log('loan', loan)

  return (
    <Stack gap={3} flex={1}>
      <PageHeader
        title="[Asset]"
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
        <LabelValueStack label="Loan type" value={loan?.loanInfo.type} />
        <LabelValueStack
          label="Total borrowed amount"
          value={`${centrifuge.utils.formatCurrencyAmount(loan?.financedAmount)}`}
        />
        <LabelValueStack
          label="Current debt"
          value={`${centrifuge.utils.formatCurrencyAmount(loan?.outstandingDebt)}`}
        />
      </PageSummary>
      {loan ? (
        <Card p={3}>
          <Stack gap={3}>
            <CardHeader title="[Asset]" />
            <Grid columns={[1, 2]} equalColumns gap={5}>
              <LabelValueList
                items={
                  [
                    { label: 'Value', value: `${centrifuge.utils.formatCurrencyAmount(loan.loanInfo.value)}` },
                    'maturityDate' in loan.loanInfo && {
                      label: 'Maturity date',
                      value: formatDate(loan.loanInfo.maturityDate),
                    },
                    'probabilityOfDefault' in loan.loanInfo && {
                      label: 'Probability of default',
                      value: `${centrifuge.utils.formatPercentage(loan.loanInfo.probabilityOfDefault, e27)}`,
                    },
                    'lossGivenDefault' in loan.loanInfo && {
                      label: 'Loss given default',
                      value: `${centrifuge.utils.formatPercentage(loan.loanInfo.lossGivenDefault, e27)}`,
                    },
                    { label: 'Financing fee', value: `${centrifuge.utils.feeToApr(loan.financingFee)}%` },
                    {
                      label: 'Advance rate',
                      value: `${centrifuge.utils.formatPercentage(loan.loanInfo.advanceRate, e27)}`,
                    },
                  ].filter(Boolean) as any
                }
              />
            </Grid>
          </Stack>
        </Card>
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
