import { Box, Button, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
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
  const { data: poolMetadata } = usePoolMetadata(pool)
  const history = useHistory()

  const centrifuge = useCentrifuge()

  return (
    <Stack gap={5} flex={1}>
      <PageHeader
        title={poolMetadata?.metadata?.name ?? ''}
        parent={{ to: '/pools', label: 'Pools' }}
        subtitle={poolMetadata?.metadata?.asset}
      />
      <PageSummary>
        <LabelValueStack label="Value" value={'[Total value]'} />
      </PageSummary>
      <Grid columns={[1, 2]} gap={3} equalColumns>
        {pool &&
          pool.tranches.map((tranche) => (
            <>
              <Card p={3} variant="interactive">
                <Stack gap={2}>
                  <CardHeader
                    pretitle="Tranche token"
                    title={'[SYMBOL]'}
                    titleAddition={centrifuge.utils.formatCurrencyAmount(tranche.totalIssuance)}
                    subtitle={`${poolMetadata?.metadata?.name} ${tranche.name} tranche`}
                  />
                  <LabelValueList
                    items={[
                      {
                        label: 'Risk protection',
                        value: (
                          <>
                            <Text color="textSecondary">
                              Min.{' '}
                              {centrifuge.utils.formatPercentage(
                                tranche.minSubordinationRatio,
                                new BN(10).pow(new BN(18)).toString()
                              )}
                            </Text>{' '}
                            [ratio]
                          </>
                        ),
                      },
                      { label: 'APR', value: `${centrifuge.utils.feeToApr(tranche.interestPerSec)}%` },
                      {
                        label: 'Reserve',
                        value: <Text color="statusOk">{centrifuge.utils.formatCurrencyAmount(tranche.reserve)}</Text>,
                      },
                    ]}
                  />
                  <ButtonGroup>
                    <Button small variant="outlined">
                      Invest
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Card>
            </>
          ))}
      </Grid>

      <Card p={3}>
        <Stack gap={3}>
          <CardHeader title={`Issuer: ${poolMetadata?.metadata?.attributes?.Issuer}`} />

          <Shelf gap={4} flex="1 1 45%">
            <Stack gap={3} alignItems="center">
              <img src={poolMetadata?.metadata?.media?.logo} style={{ maxHeight: '120px', maxWidth: '100%' }} alt="" />
              {poolMetadata?.metadata?.attributes?.Links && (
                <Shelf gap={2} rowGap={1} flexWrap="wrap">
                  {Object.entries(poolMetadata.metadata.attributes?.Links).map(([label, value]) => (
                    <AnchorPillButton href={value as string} target="_blank" rel="noopener noreferrer" key={label}>
                      {label}
                    </AnchorPillButton>
                  ))}
                </Shelf>
              )}
            </Stack>
            <Box flex="1 1 55%">
              <Text>{poolMetadata?.metadata?.description}</Text>
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
