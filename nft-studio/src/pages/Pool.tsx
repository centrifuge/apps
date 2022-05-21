import { Balance } from '@centrifuge/centrifuge-js'
import { Box, Button, Card, Grid, IconArrowRight, Shelf, Stack, Text } from '@centrifuge/fabric'
import React, { useMemo } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { ButtonGroup } from '../components/ButtonGroup'
import { CardHeader } from '../components/CardHeader'
import { ConnectButton } from '../components/ConnectButton'
import { InvestRedeemDialog } from '../components/Dialogs/InvestRedeemDialog'
import { LabelValueList } from '../components/LabelValueList'
import { LabelValueStack } from '../components/LabelValueStack'
import { LoanList } from '../components/LoanList'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { AnchorPillButton } from '../components/PillButton'
import { PoolMetadata } from '../types'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useLoans } from '../utils/useLoans'
import { usePermissions } from '../utils/usePermissions'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const PoolPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pool />
    </PageWithSideBar>
  )
}

type LinkKey = keyof PoolMetadata['pool']['links']
const linkLabels = {
  executiveSummary: 'Executive Summary',
  forum: 'Forum Discussion',
  website: 'Website',
}

const Pool: React.FC = () => {
  const {
    params: { pid: poolId },
  } = useRouteMatch<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const history = useHistory()
  const address = useAddress()

  const permissions = usePermissions(address)
  const balances = useBalances(address)

  const isPoolAdmin = useMemo(
    () => !!(address && permissions?.pools[poolId]?.roles.includes('PoolAdmin')),
    [poolId, address, permissions]
  )

  const { execute: closeEpochTx } = useCentrifugeTransaction('Close epoch', (cent) => cent.pools.closeEpoch, {
    onSuccess: () => {
      console.log('Epoch closed successfully')
    },
  })

  const closeEpoch = async () => {
    if (!pool) return
    closeEpochTx([pool.id])
  }

  const { execute: setMaxReserveTx } = useCentrifugeTransaction('Set max reserve', (cent) => cent.pools.setMaxReserve)

  const promptMaxReserve = () => {
    if (!pool) return
    const maxReserve = Number.parseFloat(prompt('Insert max reserve') || 'a')
    if (Number.isNaN(maxReserve)) return

    setMaxReserveTx([pool.id, Balance.fromFloat(maxReserve)])
  }

  return (
    <Stack gap={5} flex={1}>
      <PageHeader
        title={metadata?.pool?.name ?? ''}
        parent={{ to: '/pools', label: 'Pools' }}
        subtitle={metadata?.pool?.asset?.class}
        actions={
          <>
            {isPoolAdmin && (
              <Button small variant="tertiary" icon={<IconArrowRight />} onClick={closeEpoch} disabled={!pool}>
                Close epoch
              </Button>
            )}
          </>
        }
      />
      <PageSummary>
        <LabelValueStack label="Pool value" value={formatBalance(pool?.value ?? 0, pool?.currency, true)} />
        <LabelValueStack label="Asset value" value={formatBalance(pool?.nav.latest ?? 0, pool?.currency, true)} />
        <LabelValueStack label="Reserve" value={formatBalance(pool?.reserve.total ?? 0, pool?.currency, true)} />
        <LabelValueStack label="Max. Reserve" value={formatBalance(pool?.reserve.max ?? 0, pool?.currency)} />

        {isPoolAdmin && (
          <Button variant="tertiary" icon={<IconArrowRight />} onClick={promptMaxReserve}>
            Set maximum
          </Button>
        )}
      </PageSummary>
      <Grid columns={[1, 2]} gap={3} equalColumns>
        {pool &&
          pool.tranches.map((tranche) => {
            const tokenBalance = balances?.tranches.find(
              (t) => t.poolId === poolId && t.trancheId === tranche.id
            )?.balance
            return (
              <Card p={3} variant="interactive" key={tranche.id}>
                <Stack gap={2}>
                  <CardHeader
                    pretitle="Tranche token"
                    title={metadata?.tranches?.[tranche.seniority]?.symbol ?? ''}
                    titleAddition={formatBalance(
                      tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal()),
                      pool.currency,
                      true
                    )}
                  />
                  <LabelValueList
                    items={
                      [
                        tranche.minRiskBuffer && {
                          label: 'Risk protection',
                          value: (
                            <>
                              <Text color="textSecondary">
                                Min. {formatPercentage(tranche.minRiskBuffer.toPercent())}
                              </Text>{' '}
                              {formatPercentage(tranche.currentRiskBuffer.toPercent())}
                            </>
                          ),
                        },
                        tranche.interestRatePerSec && {
                          label: 'APR',
                          value: `${formatPercentage(tranche.interestRatePerSec.toPercent())}`,
                        },
                        {
                          label: 'Token price',
                          value: formatBalance(tranche.tokenPrice.toFloat(), pool.currency, true),
                        },
                        {
                          label: 'Currently locked investment',
                          value: formatBalance(
                            (tokenBalance?.toFloat() ?? 0) * tranche.tokenPrice.toFloat(),
                            pool.currency
                          ),
                        },
                      ].filter(Boolean) as any
                    }
                  />
                  <InvestAction poolId={poolId} trancheId={tranche.id} />
                </Stack>
              </Card>
            )
          })}
      </Grid>

      {metadata?.pool?.issuer && (
        <Card p={3}>
          <Stack gap={3}>
            <CardHeader title={`Issuer: ${metadata?.pool?.issuer?.name}`} />

            <Shelf gap={4} flex="1 1 45%">
              <Stack gap={3} alignItems="center">
                <img src={metadata?.pool?.issuer?.logo} style={{ maxHeight: '120px', maxWidth: '100%' }} alt="" />
                {(metadata?.pool?.links || metadata?.pool?.issuer?.email) && (
                  <Shelf gap={2} rowGap={1} flexWrap="wrap">
                    {metadata.pool.links &&
                      Object.entries(metadata.pool.links).map(([label, value]) => (
                        <AnchorPillButton href={value as string} target="_blank" rel="noopener noreferrer" key={label}>
                          {linkLabels[label as LinkKey] ?? label}
                        </AnchorPillButton>
                      ))}
                    {metadata.pool.issuer?.email && (
                      <AnchorPillButton href={`mailto:${metadata.pool.issuer.email}`}>
                        Contact the issuer
                      </AnchorPillButton>
                    )}
                  </Shelf>
                )}
              </Stack>
              <Box flex="1 1 55%">
                <Text>{metadata?.pool?.issuer?.description}</Text>
              </Box>
            </Shelf>
          </Stack>
        </Card>
      )}
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

export const InvestAction: React.FC<{ poolId: string; trancheId: string }> = ({ poolId, trancheId }) => {
  const [open, setOpen] = React.useState(false)
  const address = useAddress()
  return (
    <>
      <ButtonGroup>
        {address ? (
          <Button small variant="secondary" onClick={() => setOpen(true)}>
            Invest
          </Button>
        ) : (
          <ConnectButton small variant="secondary" />
        )}
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
