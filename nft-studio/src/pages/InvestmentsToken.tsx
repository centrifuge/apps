import { Button, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { ConnectButton } from '../components/ConnectButton'
import { InvestRedeemDialog } from '../components/Dialogs/InvestRedeemDialog'
import { InvestRedeem } from '../components/InvestRedeem'
import { LabelValueList } from '../components/LabelValueList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { Dec } from '../utils/Decimal'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const InvestmentsTokenPage: React.FC = () => {
  const { pid: poolId, tid: trancheId } = useParams<{ pid: string; tid: string }>()
  return (
    <PageWithSideBar sidebar={<InvestRedeem poolId={poolId} trancheId={trancheId} />}>
      <Token />
    </PageWithSideBar>
  )
}

const Token: React.FC = () => {
  const { pid: poolId, tid: trancheId } = useParams<{ pid: string; tid: string }>()
  const address = useAddress()
  const balances = useBalances(address)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const token = balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.seniority] : null

  if (pool && !tranche) throw new Error('Token not found')

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
                  tranche.interestRatePerSec && {
                    label: 'APR',
                    value: formatPercentage(tranche.interestRatePerSec.toAprPercent()),
                  },
                  {
                    label: 'Value',
                    value: formatBalance(
                      tranche.balance.toDecimal().mul(tranche.tokenPrice.toDecimal()),
                      pool.currency,
                      true
                    ),
                  },
                  {
                    label: 'Price',
                    value: formatBalance(tranche.tokenPrice.toFloat(), pool.currency, true),
                  },
                  tranche.minRiskBuffer && {
                    label: 'Risk protection',
                    value: (
                      <>
                        <Text color="textSecondary">Min. {formatPercentage(tranche.minRiskBuffer)}</Text>{' '}
                        {formatPercentage(tranche.currentRiskBuffer)}
                      </>
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
                    value: formatBalance(token?.balance ?? 0, trancheMeta?.symbol || ' ', true),
                  },
                  {
                    label: 'Value',
                    value: formatBalance(
                      (token?.balance.toDecimal() ?? Dec(0)).mul(tranche.tokenPrice.toDecimal()),
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

export const InvestAction: React.FC<{ poolId: string; trancheId: string }> = ({ poolId, trancheId }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <ButtonGroup>
        <Button variant="secondary" onClick={() => setOpen(true)}>
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

export const RedeemAction: React.FC<{ poolId: string; trancheId: string }> = ({ poolId, trancheId }) => {
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
