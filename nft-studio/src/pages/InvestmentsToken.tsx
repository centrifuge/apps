import { Button, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { ConnectButton } from '../components/ConnectButton'
import { InvestRedeemDialog } from '../components/Dialogs/InvestRedeemDialog'
import { InvestRedeem } from '../components/InvestRedeem'
import { LabelValueList } from '../components/LabelValueList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const InvestmentsTokenPage: React.FC = () => {
  const { pid: poolId, tid } = useParams<{ pid: string; tid: string }>()
  const trancheId = Number(tid)
  return (
    <PageWithSideBar sidebar={<InvestRedeem poolId={poolId} trancheId={trancheId} />}>
      <Token />
    </PageWithSideBar>
  )
}

const Token: React.FC = () => {
  const { pid: poolId, tid } = useParams<{ pid: string; tid: string }>()
  const address = useAddress()
  const balances = useBalances(address)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const centrifuge = useCentrifuge()
  const trancheId = Number(tid)

  const token = balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)
  const tranche = pool?.tranches[trancheId]
  const trancheMeta = metadata?.tranches?.[trancheId]

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
                      pool.currency,
                      true
                    ),
                  },
                  {
                    label: 'Price',
                    value: centrifuge.utils.formatCurrencyAmount(
                      new BN(tranche.tokenPrice).div(new BN(1e9)),
                      pool.currency,
                      true
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
                        {centrifuge.utils.formatCurrencyAmount(tranche.reserve, pool.currency, true)}
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
                    value: centrifuge.utils.formatCurrencyAmount(
                      token?.balance ?? '0',
                      trancheMeta?.symbol || ' ',
                      true
                    ),
                  },
                  {
                    label: 'Value',
                    value: centrifuge.utils.formatCurrencyAmount(
                      new BN(token?.balance ?? 0)
                        .mul(new BN(pool.tranches[trancheId].tokenPrice))
                        .div(new BN(10).pow(new BN(27))),
                      pool.currency,
                      true
                    ),
                  },
                ]}
              />
              <ButtonGroup>
                {address ? (
                  <>
                    <RedeemAction poolId={poolId} trancheId={trancheId} />
                    <InvestAction poolId={poolId} trancheId={trancheId} />
                  </>
                ) : (
                  <ConnectButton />
                )}
              </ButtonGroup>
            </Stack>
          </Card>
        </Grid>
      )}
    </Stack>
  )
}

export const InvestAction: React.FC<{ poolId: string; trancheId: number }> = ({ poolId, trancheId }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <ButtonGroup>
        <Button variant="outlined" onClick={() => setOpen(true)}>
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

export const RedeemAction: React.FC<{ poolId: string; trancheId: number }> = ({ poolId, trancheId }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setOpen(true)}>Redeem</Button>
      </ButtonGroup>
      <InvestRedeemDialog
        poolId={poolId}
        trancheId={trancheId}
        open={open}
        onClose={() => setOpen(false)}
        action="redeem"
      />
    </>
  )
}
