import { Loan, Pool } from '@centrifuge/centrifuge-js'
import { useGetNetworkName } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, DateInput, IconDownload, SearchInput, Select, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { useNavigate } from 'react-router'
import { usePool } from '../../../src/utils/usePools'
import { nftMetadataSchema } from '../../schemas'
import { useBasePath } from '../../utils/useBasePath'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useDebugFlags } from '../DebugFlags'
import { GroupBy, Report, ReportContext } from './ReportContext'
import { formatPoolFeeTransactionType } from './utils'

type ReportFilterProps = {
  poolId: string
}

export function DataFilter({ poolId }: ReportFilterProps) {
  const {
    csvData,
    setStartDate,
    startDate,
    endDate,
    setEndDate,
    report,
    loanStatus,
    setLoanStatus,
    txType,
    setTxType,
    groupBy,
    setGroupBy,
    activeTranche,
    setActiveTranche,
    address,
    setAddress,
    network,
    setNetwork,
    loan,
    setLoan,
  } = React.useContext(ReportContext)
  const navigate = useNavigate()
  const basePath = useBasePath()
  const pool = usePool(poolId) as Pool

  const { data: domains } = useActiveDomains(pool.id)
  const getNetworkName = useGetNetworkName()
  const loans = useLoans(pool.id) as Loan[] | undefined

  const { showOracleTx } = useDebugFlags()

  const reportOptions: { label: string; value: Report }[] = [
    { label: 'Investor transactions', value: 'investor-tx' },
    { label: 'Asset transactions', value: 'asset-tx' },
    { label: 'Fee transactions', value: 'fee-tx' },
    ...(showOracleTx === true ? [{ label: 'Oracle transactions', value: 'oracle-tx' as Report }] : []),
    { label: 'Token price', value: 'token-price' },
    { label: 'Asset list', value: 'asset-list' },
    { label: 'Investor list', value: 'investor-list' },
  ]

  return (
    <Shelf
      alignItems="center"
      flexWrap="wrap"
      gap={2}
      p={2}
      borderWidth={0}
      borderBottomWidth={1}
      borderStyle="solid"
      borderColor="borderPrimary"
    >
      <Select
        name="report"
        label="Report"
        options={reportOptions}
        value={report}
        onChange={(event: { target: { value: any } }) => {
          if (event.target.value) {
            navigate(`${basePath}/${pool.id}/data/${event.target.value}`)
          }
        }}
      />

      {!['investor-list', 'asset-list', 'balance-sheet', 'cash-flow-statement', 'profit-and-loss'].includes(report) && (
        <>
          <DateInput label="From" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          <DateInput label="To" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </>
      )}

      {['pool-balance', 'token-price'].includes(report) && (
        <Select
          name="groupBy"
          label="Group by"
          options={[
            {
              label: 'Day',
              value: 'day',
            },
            {
              label: 'Month',
              value: 'month',
            },
          ]}
          value={groupBy}
          onChange={(event) => {
            if (event.target.value) {
              setGroupBy(event.target.value as GroupBy)
            }
          }}
        />
      )}

      {report === 'asset-list' && (
        <>
          <Select
            name="loanStatus"
            label="Status"
            options={[
              {
                label: 'All',
                value: 'all',
              },
              {
                label: 'Ongoing',
                value: 'ongoing',
              },
              {
                label: 'Repaid',
                value: 'repaid',
              },
              {
                label: 'Overdue',
                value: 'overdue',
              },
            ]}
            value={loanStatus}
            onChange={(event) => {
              setLoanStatus(event.target.value)
            }}
          />
          <DateInput label="Day" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </>
      )}

      {(report === 'investor-list' || report === 'investor-tx') && (
        <Select
          name="activeTranche"
          label="Token"
          options={[
            {
              label: 'All tokens',
              value: 'all',
            },
            ...pool.tranches.map((token) => {
              return {
                label: token.currency.name,
                value: token.id,
              }
            }),
          ]}
          value={activeTranche}
          onChange={(event) => {
            if (event.target.value) {
              setActiveTranche(event.target.value)
            }
          }}
        />
      )}
      {report === 'asset-tx' && (
        <Select
          name="loan"
          label="Asset"
          onChange={(event) => {
            setLoan(event.target.value)
          }}
          value={loan}
          options={[
            { label: 'All', value: 'all' },
            ...(loans?.map((l) => ({ value: l.id, label: <LoanOption loan={l as Loan} key={l.id} /> })) ?? []),
          ]}
        />
      )}

      {['balance-sheet', 'cash-flow-statement', 'profit-and-loss'].includes(report) && (
        <>
          <Select
            name="balanceSheetGroupBy"
            onChange={(event) => {
              setGroupBy(event.target.value as GroupBy)
            }}
            value={groupBy}
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Daily', value: 'daily' },
              { label: 'Monthly', value: 'month' },
              { label: 'Quarterly', value: 'quarter' },
              { label: 'Yearly', value: 'year' },
            ]}
            hideBorder
          />
          {groupBy === 'day' && (
            <DateInput label="Day" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          )}
          {groupBy === 'month' || groupBy === 'daily' ? (
            <>
              <DateInput label="From" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
              <DateInput label="To" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </>
          ) : null}
        </>
      )}

      {['investor-tx', 'asset-tx', 'fee-tx'].includes(report) && (
        <Select
          name="txType"
          label="Transaction type"
          options={
            report === 'investor-tx'
              ? [
                  {
                    label: 'All',
                    value: 'all',
                  },
                  {
                    label: 'Submitted orders',
                    value: 'orders',
                  },
                  {
                    label: 'Executed orders',
                    value: 'executions',
                  },
                  {
                    label: 'Transfers',
                    value: 'transfers',
                  },
                ]
              : report === 'asset-tx'
              ? [
                  {
                    label: 'All',
                    value: 'all',
                  },
                  {
                    label: 'Created',
                    value: 'Created',
                  },
                  {
                    label: 'Financed',
                    value: 'Financed',
                  },
                  {
                    label: 'Repaid',
                    value: 'Repaid',
                  },
                  {
                    label: 'Priced',
                    value: 'Priced',
                  },
                  {
                    label: 'Closed',
                    value: 'Closed',
                  },
                ]
              : [
                  {
                    label: 'All',
                    value: 'all',
                  },
                  {
                    label: formatPoolFeeTransactionType('CHARGED'),
                    value: 'CHARGED',
                  },
                  {
                    label: formatPoolFeeTransactionType('UNCHARGED'),
                    value: 'UNCHARGED',
                  },
                  {
                    label: formatPoolFeeTransactionType('ACCRUED'),
                    value: 'ACCRUED',
                  },
                  {
                    label: formatPoolFeeTransactionType('PAID'),
                    value: 'PAID',
                  },
                ]
          }
          value={txType}
          onChange={(event) => {
            if (event.target.value) {
              setTxType(event.target.value)
            }
          }}
        />
      )}
      {['investor-tx', 'investor-list'].includes(report) && (
        <>
          <Select
            name="network"
            label="Network"
            options={[
              {
                label: 'All',
                value: 'all',
              },
              {
                label: 'Centrifuge',
                value: 'centrifuge',
              },
              ...(domains ?? []).map((domain) => {
                return {
                  label: getNetworkName(domain.chainId),
                  value: String(domain.chainId),
                }
              }),
            ]}
            value={network}
            onChange={(e) => {
              const { value } = e.target
              if (value) {
                setNetwork(isNaN(Number(value)) ? value : Number(value))
              }
            }}
          />
          <SearchInput
            name="address"
            label="Address"
            placeholder="Filter by address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </>
      )}
      <Box ml="auto">
        <AnchorButton
          disabled={!csvData}
          download={csvData?.fileName}
          href={csvData?.dataUrl}
          icon={<IconDownload />}
          small
          variant="inverted"
        >
          CSV
        </AnchorButton>
      </Box>
    </Shelf>
  )
}

function LoanOption({ loan }: { loan: Loan }) {
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, false)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <option value={loan.id}>
      {loan.id} - {metadata?.name}
    </option>
  )
}
