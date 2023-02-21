import { findBalance, Pool, Token } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Button,
  Grid,
  IconAlertCircle,
  IconCheckCircle,
  IconInfoFailed,
  IconMinus,
  IconPlus,
  SearchInput,
  Shelf,
  Stack,
  Text,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { useParams } from 'react-router'
import { DataTable } from '../../../components/DataTable'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useAddress } from '../../../utils/useAddress'
import { usePermissions } from '../../../utils/usePermissions'
import { useOrder, usePool } from '../../../utils/usePools'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolInvestorsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolInvestors />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const IssuerPoolInvestors: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const address = useAddress()
  const permissions = usePermissions(address)
  const canEditInvestors = address && permissions?.pools[poolId]?.roles.includes('MemberListAdmin')

  return <>{canEditInvestors && <Investors />}</>
}

const SevenDaysMs = (7 * 24 + 1) * 60 * 60 * 1000 // 1 hour margin

export const Investors: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const [address, setAddress] = React.useState('')
  const validAddress = isAddress(address) ? address : undefined
  const permissions = usePermissions(validAddress)
  const [pendingTrancheId, setPendingTrancheId] = React.useState('')

  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Update investor',
    (cent) => cent.pools.updatePoolRoles,
    {}
  )

  const allowedTranches = Object.entries(permissions?.pools[poolId]?.tranches ?? {})
    .filter(([, till]) => new Date(till).getTime() - Date.now() > SevenDaysMs)
    .map(([tid]) => tid)

  const pool = usePool(poolId) as Pool

  function toggleAllowed(trancheId: string) {
    if (!validAddress) return
    const isAllowed = allowedTranches.includes(trancheId)
    const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)
    const SevenDaysFromNow = Math.floor((Date.now() + SevenDaysMs) / 1000)

    if (isAllowed) {
      execute([poolId, [], [[validAddress, { TrancheInvestor: [trancheId, OneHundredYearsFromNow] }]]])
    } else {
      execute([poolId, [[validAddress, { TrancheInvestor: [trancheId, SevenDaysFromNow] }]], []])
    }
    setPendingTrancheId(trancheId)
  }

  return (
    <PageSection
      title="Investor status"
      subtitle="Display investor status, and add or remove from investor memberlist."
    >
      <Stack gap={2}>
        <Grid columns={2} equalColumns gap={4} alignItems="center">
          <SearchInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address..."
            clear={() => setAddress('')}
          />
          {address && !validAddress ? (
            <Text variant="label2" color="statusCritical">
              <Shelf gap={1}>
                <IconInfoFailed size="20px" />
                <span>Invalid address</span>
              </Shelf>
            </Text>
          ) : (
            validAddress &&
            (allowedTranches.length ? (
              <Text variant="label2" color="statusOk">
                <Shelf gap={1}>
                  <IconCheckCircle size="20px" />
                  <span>Address added to memberlist</span>
                </Shelf>
              </Text>
            ) : permissions && !allowedTranches.length ? (
              <Text variant="label2" color="statusWarning">
                <Shelf gap={1}>
                  <IconAlertCircle size="20px" />
                  <span>Address not in memberlist</span>
                </Shelf>
              </Text>
            ) : null)
          )}
        </Grid>
        {pool?.tranches && validAddress && permissions && (
          <DataTable
            data={pool.tranches}
            columns={[
              {
                align: 'left',
                header: 'Token',
                cell: (row: Token) => (
                  <Text textOverflow="ellipsis" variant="body2">
                    {row.currency.name}
                  </Text>
                ),
                flex: '1',
              },
              {
                align: 'left',
                header: 'Investment',
                cell: (row: Token) => <InvestedCell address={validAddress} poolId={poolId} trancheId={row.id} />,
                flex: '1',
              },
              {
                header: '',
                align: 'right',
                cell: (row: Token) => {
                  const isAllowed = allowedTranches.includes(row.id)

                  return (
                    <Button
                      variant="tertiary"
                      icon={isAllowed ? IconMinus : IconPlus}
                      onClick={() => toggleAllowed(row.id)}
                      loading={isTransactionPending && pendingTrancheId === row.id}
                      small
                    >
                      {isAllowed ? 'Remove from memberlist' : 'Add to memberlist'}
                    </Button>
                  )
                },
                flex: '1',
              },
            ]}
          />
        )}
      </Stack>
    </PageSection>
  )
}

const InvestedCell: React.FC<{ address: string; poolId: string; trancheId: string }> = ({
  poolId,
  trancheId,
  address,
}) => {
  const order = useOrder(poolId, trancheId, address)
  const balances = useBalances(address)
  const hasBalance = balances && findBalance(balances.tranches, { Tranche: [poolId, trancheId] })
  const hasOrder = order && (order?.submittedAt > 0 || !order.invest.isZero())
  const hasInvested = hasBalance || hasOrder

  return <TextWithPlaceholder variant="body2">{hasInvested && 'Invested'}</TextWithPlaceholder>
}
