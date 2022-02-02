import { Box, Button, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { InvestRedeemDialog } from '../components/InvestRedeemDialog'
import { LabelValueList } from '../components/LabelValueList'
import { LabelValueStack } from '../components/LabelValueStack'
import { LoanList } from '../components/LoanList'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { AnchorPillButton } from '../components/PillButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useLoans } from '../utils/useLoans'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const PoolPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pool />
    </PageWithSideBar>
  )
}

const Pool: React.FC = () => {
  const {
    params: { pid: poolId },
  } = useRouteMatch<{ pid: string }>()
  const { data: pool } = usePool(poolId)
  const { data: loans } = useLoans(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const history = useHistory()

  console.log('pool', pool)

  const centrifuge = useCentrifuge()

  return (
    <Stack gap={5} flex={1}>
      <PageHeader
        title={metadata?.pool?.name ?? ''}
        parent={{ to: '/pools', label: 'Pools' }}
        subtitle={metadata?.pool?.asset?.class}
      />
      <PageSummary>
        <LabelValueStack
          label="Value"
          value={centrifuge.utils.formatCurrencyAmount(pool?.nav.latest, pool?.currency)}
        />
      </PageSummary>
      <Grid columns={[1, 2]} gap={3} equalColumns>
        {pool &&
          pool.tranches.map((tranche, i) => (
            <>
              <Card p={3} variant="interactive">
                <Stack gap={2}>
                  <CardHeader
                    pretitle="Tranche token"
                    title={metadata?.tranches?.[i]?.symbol ?? ''}
                    titleAddition={centrifuge.utils.formatCurrencyAmount(tranche.totalIssuance, pool.currency)}
                    subtitle={metadata?.tranches?.[i]?.name || `${metadata?.pool?.name} ${tranche.name} tranche`}
                  />
                  <LabelValueList
                    items={
                      [
                        tranche.name !== 'Junior' && {
                          label: 'Risk protection',
                          value: (
                            <>
                              <Text color="textSecondary">
                                Min.{' '}
                                {centrifuge.utils.formatPercentage(
                                  tranche.minRiskBuffer,
                                  new BN(10).pow(new BN(18)).toString()
                                )}
                              </Text>{' '}
                              {centrifuge.utils.formatPercentage(tranche.ratio, new BN(10).pow(new BN(18)).toString())}
                            </>
                          ),
                        },
                        tranche.name !== 'Junior' && {
                          label: 'APR',
                          value: `${centrifuge.utils.feeToApr(tranche.interestPerSec)}%`,
                        },
                        {
                          label: 'Reserve',
                          value: (
                            <Text color="statusOk">
                              {centrifuge.utils.formatCurrencyAmount(tranche.reserve, pool.currency)}
                            </Text>
                          ),
                        },
                      ].filter(Boolean) as any
                    }
                  />
                  <InvestAction poolId={poolId} trancheId={i} />
                </Stack>
              </Card>
            </>
          ))}
      </Grid>

      <Card p={3}>
        <Stack gap={3}>
          <CardHeader title={`Issuer: ${metadata?.pool?.issuer?.name}`} />

          <Shelf gap={4} flex="1 1 45%">
            <Stack gap={3} alignItems="center">
              <img src={metadata?.pool?.media?.logo} style={{ maxHeight: '120px', maxWidth: '100%' }} alt="" />
              {metadata?.pool?.attributes?.Links && (
                <Shelf gap={2} rowGap={1} flexWrap="wrap">
                  {Object.entries(metadata.pool.attributes.Links).map(([label, value]) => (
                    <AnchorPillButton href={value as string} target="_blank" rel="noopener noreferrer" key={label}>
                      {label}
                    </AnchorPillButton>
                  ))}
                </Shelf>
              )}
            </Stack>
            <Box flex="1 1 55%">
              <Text>{metadata?.pool?.description}</Text>
            </Box>
          </Shelf>
        </Stack>
      </Card>
      <Stack gap={2}>
        <Text variant="heading2" as="h2">
          Assets
        </Text>
        {loans && pool && (
          <LoanList
            loans={loans}
            onLoanClicked={(loan) => {
              history.push(`/pools/${pool.id}/assets/${loan.id}`)
            }}
          />
        )}
      </Stack>
    </Stack>
  )
}

export const InvestAction: React.FC<{ poolId: string; trancheId: number }> = ({ poolId, trancheId }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <ButtonGroup>
        <Button small variant="outlined" onClick={() => setOpen(true)}>
          Invest
        </Button>
      </ButtonGroup>
      <InvestRedeemDialog
        poolId={poolId}
        trancheId={trancheId}
        open={open}
        onClose={() => setOpen(false)}
        action="invest"
      />
    </>
  )
}
