import { CurrencyBalance, CurrencyMetadata, Loan, Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, Grid, IconDownload, IconInfo, IconPlus, Spinner, Text } from '@centrifuge/fabric'
import { useMemo, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { useSelectedPools } from '../../..//utils/contexts/SelectedPoolsContext'
import { useLoans } from '../../..//utils/useLoans'
import { useAllPoolAssetSnapshotsMulti, usePools } from '../../..//utils/usePools'
import { DataTable, FilterableTableHeader, SortableTableHeader } from '../../../components/DataTable'
import { formatDate } from '../../../utils/date'
import { formatBalance } from '../../../utils/formatting'
import { getCSVDownloadUrl } from '../../../utils/getCSVDownloadUrl'
import { useFilters } from '../../../utils/useFilters'
import { LoanLabel, getLoanLabelStatus } from '../../LoanLabel'
import { Amount } from '../../LoanList'
import { TransformedLoan, usePoolMetadataMap } from '../utils'
import { CreateAssetsDrawer } from './CreateAssetsDrawer'

const StyledButton = styled(AnchorButton)`
  & > span {
    min-height: 36px;
  }
`

const status = ['Ongoing', 'Overdue', 'Repaid', 'Closed', 'Active']

type Row = Loan & {
  poolName: string
  asset: string
  maturityDate: string
  quantity: CurrencyBalance
  value: CurrencyBalance
  currency: CurrencyMetadata
  unrealizedPL: CurrencyBalance
  realizedPL: CurrencyBalance
  loan: Loan
  status: typeof status
  assetName: string
  poolIcon: string
  poolId: string
  assetId: string
  valuationMethod: string
  pool: Pool
}

export function AssetsTable() {
  const theme = useTheme()
  const pools = usePools()
  const { selectedPoolIds } = useSelectedPools()
  const { data: loans } = useLoans(pools ? selectedPoolIds.slice(0, 10) : [])
  const cent = useCentrifuge()
  const loansWithPool =
    loans?.map((loan) => ({
      ...loan,
      pool: pools?.find((pool) => pool.id === loan.poolId) || null,
    })) || []

  const extractedPools = loansWithPool.map((loan) => loan.pool!) ?? []
  const poolMetadataMap = usePoolMetadataMap(extractedPools.slice(0, 1))
  const today = new Date().toISOString().slice(0, 10)
  const [allSnapshots, isLoading] = useAllPoolAssetSnapshotsMulti(extractedPools.slice(0, 1), today)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [drawerType, setDrawerType] = useState<'create-asset' | 'upload-template'>('create-asset')

  const loansData = loansWithPool
    .flatMap((loan) => {
      const snapshots = allSnapshots?.[loan?.poolId] ?? []
      const metadata = poolMetadataMap.get(loan?.poolId)
      const poolIcon = metadata?.pool?.icon?.uri && cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)
      const poolName = metadata?.pool?.name
      return snapshots
        ?.filter((snapshot) => {
          const snapshotLoanId = snapshot.assetId.split('-')[1]
          return snapshotLoanId === loan.id
        })
        .map((snapshot) => {
          return {
            poolIcon,
            currency: loan?.pool?.currency,
            poolName,
            assetName: snapshot.asset.name,
            maturityDate: snapshot.actualMaturityDate,
            poolId: loan.poolId,
            quantity: snapshot.outstandingQuantity,
            value: (loan as TransformedLoan).presentValue,
            unrealizedPL: snapshot.unrealizedProfitAtMarketPrice,
            realizedPL: snapshot.sumRealizedProfitFifo,
            status: loan.status,
            loan,
            assetId: snapshot.assetId.split('-')[1],
            pool: loan.pool,
          }
        })
    })
    .filter((pool) => selectedPoolIds.includes(pool.poolId))

  const data = useMemo(
    () =>
      loansData.map((loan) => {
        const [, text] = getLoanLabelStatus(loan.loan)
        const {
          quantity,
          value,
          unrealizedPL,
          realizedPL,
          assetName,
          poolId,
          currency,
          poolName,
          maturityDate,
          assetId,
          poolIcon,
          pool,
        } = loan
        return {
          poolName,
          poolIcon,
          assetId,
          maturityDate,
          quantity,
          value,
          unrealizedPL,
          realizedPL,
          loan: loan.loan,
          status: text,
          assetName,
          poolId,
          currency,
          pool,
        }
      }),
    [loansData]
  )

  const filters = useFilters({
    data,
  })

  const columns = [
    {
      align: 'left',
      header: <SortableTableHeader label="Pool" />,
      cell: ({ poolName, poolIcon }: Row) => {
        return (
          <Box display="flex" alignItems="center">
            {poolIcon && <Box as="img" src={poolIcon} alt="" height={24} width={24} borderRadius={4} mr={1} />}
            <Text style={{ fontWeight: 500 }} variant="body3">
              {poolName}
            </Text>
          </Box>
        )
      },
      sortKey: 'poolName',
      width: '200px',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Asset" />,
      cell: ({ assetName }: Row) => (
        <Text variant="body3" style={{ fontWeight: 700 }}>
          {assetName}
        </Text>
      ),
      sortKey: 'assetName',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Maturity date" />,
      cell: ({ maturityDate }: Row) => (
        <Text variant="body3" style={{ fontWeight: 500 }}>
          {maturityDate ? formatDate(maturityDate) : '-'}
        </Text>
      ),
      sortKey: 'maturityDate',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Quantity" />,
      cell: ({ loan }: Row) => {
        return <Amount loan={loan as Loan} style={{ fontSize: 12, fontWeight: 500 }} />
      },
      sortKey: 'quantity',
      width: '120px',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Value" />,
      cell: ({ value, currency }: Row) => (
        <Text variant="body3" style={{ fontWeight: 500 }}>
          {value ? formatBalance(value, currency.displayName, 2) : '-'}
        </Text>
      ),
      sortKey: 'value',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Unrealized P&L" />,
      cell: ({ unrealizedPL, currency }: Row) => (
        <Text variant="body3" style={{ fontWeight: 500 }}>
          {unrealizedPL ? formatBalance(unrealizedPL, currency.symbol, 2, 2) : '-'}
        </Text>
      ),
      sortKey: 'unrealizedPL',
    },
    {
      align: 'left',
      header: <SortableTableHeader label="Realized P&L" />,
      cell: ({ realizedPL, currency }: Row) => (
        <Text variant="body3" style={{ fontWeight: 500 }}>
          {realizedPL ? formatBalance(realizedPL, currency.symbol, 2, 2) : '-'}
        </Text>
      ),
      sortKey: 'realizedPL',
    },
    {
      align: 'left',
      header: <FilterableTableHeader filterKey="status" label="Status" options={status} filters={filters} />,
      cell: (row: Row) => <LoanLabel loan={row.loan as Loan} />,
    },
  ]

  const csvData = useMemo(() => {
    if (!data.length) return undefined

    return data.map((loan) => {
      const quantity = 'getAmount(loan.loan, loan.pool)'

      return {
        Pool: loan.poolName,
        Asset: loan.maturityDate ? loan.maturityDate : '-',
        'Maturity Date': loan.maturityDate ? loan.maturityDate : '-',
        Quantity: `${quantity ?? '-'}`,
        Value: loan.value ? loan.value : '-',
        'Unrealized P&L': loan.unrealizedPL ? loan.unrealizedPL : '-',
        'Realized P&L': loan.realizedPL ? loan.realizedPL : '-',
        Status: loan.status ? loan.status : '-',
      }
    })
  }, [data])

  const csvUrl = useMemo(() => csvData && getCSVDownloadUrl(csvData as any), [csvData])

  if (isLoading) return <Spinner />

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box
            background={theme.colors.backgroundTertiary}
            borderRadius="50%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="28px"
            height="28px"
            style={{ fontWeight: 500, fontSize: 12 }}
            mr={1}
          >
            {filters.data.length}
          </Box>

          <Text variant="heading4">Assets</Text>
        </Box>
        <Grid gridTemplateColumns={filters.data.length ? '160px 220px 44px' : '160px 220px'} gap={1}>
          {!!selectedPoolIds.length && (
            <Button
              icon={<IconPlus />}
              small
              onClick={() => {
                setDrawerOpen(true)
                setDrawerType('create-asset')
              }}
            >
              Create asset
            </Button>
          )}
          {!!selectedPoolIds.length && (
            <Button
              variant="inverted"
              small
              onClick={() => {
                setDrawerOpen(true)
                setDrawerType('upload-template')
              }}
            >
              Manage asset templates
            </Button>
          )}
          {!!filters.data.length && (
            <StyledButton
              href={csvUrl ?? ''}
              download={`dashboard-assets.csv`}
              variant="inverted"
              icon={IconDownload}
              small
              target="_blank"
              disabled={!filters.data.length}
            />
          )}
        </Grid>
      </Box>
      <Box mt={3}>
        {filters.data.length ? (
          <DataTable
            data={filters.data}
            columns={columns}
            scrollable
            onRowClicked={(row) => `/pools/${row.poolId}/assets/${row.assetId}`}
          />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            background={theme.colors.backgroundSecondary}
            borderRadius={4}
            p={2}
            border={`1px solid ${theme.colors.borderPrimary}`}
          >
            <IconInfo size={14} style={{ marginRight: 8 }} />
            <Text variant="body3" color="textSecondary">
              No assets displayed yet
            </Text>
          </Box>
        )}
      </Box>
      {!!selectedPoolIds.length && (
        <CreateAssetsDrawer open={drawerOpen} setOpen={setDrawerOpen} type={drawerType} setType={setDrawerType} />
      )}
    </>
  )
}
