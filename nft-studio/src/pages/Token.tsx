import { Button, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { LabelValueList } from '../components/LabelValueList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useInvestmentTokens } from '../utils/useInvestments'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const TokenPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Token />
    </PageWithSideBar>
  )
}

const Token: React.FC = () => {
  const { pid: poolId, tid } = useParams<{ pid: string; tid: string }>()
  const { data: tokens } = useInvestmentTokens('kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF')
  const { data: pool } = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
  const trancheIndex = Number(tid)

  const token = tokens?.find((t) => t.poolId === poolId && t.trancheIndex === trancheIndex)
  const tranche = pool?.tranches[trancheIndex]
  const trancheMeta = metadata?.tranches?.[trancheIndex]

  console.log('tokens', tokens)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        parent={{ label: 'Tokens', to: '/investments/tokens' }}
        title={trancheMeta?.symbol ?? ''}
        subtitle={trancheMeta?.name ?? ''}
        subtitleLink={{ label: metadata?.pool?.name ?? '', to: `/pools/${poolId}` }}
      />

      {pool && tranche && (
        <Grid columns={[1, 2]} gap={3} equalColumns>
          <Card p={3}>
            <LabelValueList
              items={
                [
                  tranche.name !== 'Junior' && {
                    label: 'APR',
                    value: `${centrifuge.utils.feeToApr(tranche.interestPerSec)}%`,
                  },
                  {
                    label: 'Value',
                    value: centrifuge.utils.formatCurrencyAmount(
                      new BN(tranche.debt).mul(new BN(tranche.tokenPrice)).div(new BN(10).pow(new BN(27))),
                      pool.currency
                    ),
                  },
                  {
                    label: 'Price',
                    value: centrifuge.utils.formatCurrencyAmount(
                      new BN(tranche.tokenPrice).div(new BN(1e9)),
                      pool.currency
                    ),
                  },
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
          </Card>
          <Card p={3}>
            <Stack gap={2}>
              <CardHeader title="My investment" />
              <LabelValueList
                items={[
                  {
                    label: 'Balance',
                    value: centrifuge.utils.formatCurrencyAmount(token?.balance, trancheMeta?.symbol),
                  },
                  {
                    label: 'Value',
                    value:
                      token?.balance &&
                      centrifuge.utils.formatCurrencyAmount(
                        new BN(token.balance)
                          .mul(new BN(pool.tranches[trancheIndex].tokenPrice))
                          .div(new BN(10).pow(new BN(27))),
                        pool.currency
                      ),
                  },
                ]}
              />
              <ButtonGroup>
                <Button variant="outlined">Redeem</Button>
                <Button>Invest</Button>
              </ButtonGroup>
            </Stack>
          </Card>
        </Grid>
      )}
    </Stack>
  )
}
