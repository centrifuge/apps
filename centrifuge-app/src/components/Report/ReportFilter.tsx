import { Loan, Pool } from '@centrifuge/centrifuge-js'
import { useGetNetworkName } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, DateInput, SearchInput, Select, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { nftMetadataSchema } from '../../schemas'
import { useActiveDomains } from '../../utils/useLiquidityPools'
import { useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useDebugFlags } from '../DebugFlags'
import { GroupBy, Report, ReportContext } from './ReportContext'
import { formatPoolFeeTransactionType } from './utils'

type ReportFilterProps = {
  pool: Pool
}

export function ReportFilter({ pool }: ReportFilterProps) {
  const { holdersReport } = useDebugFlags()

  const {
    csvData,
    setStartDate,
    startDate,
    endDate,
    setEndDate,
    report,
    setReport,
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
  const { data: domains } = useActiveDomains(pool.id)
  const getNetworkName = useGetNetworkName()
  const loans = useLoans(pool.id) as Loan[] | undefined

  const reportOptions: { label: string; value: Report }[] = [
    { label: 'Balance sheet', value: 'balance-sheet' },
    { label: 'Investor transactions', value: 'investor-tx' },
    { label: 'Asset transactions', value: 'asset-tx' },
    { label: 'Fee transactions', value: 'fee-tx' },
    { label: 'Pool balance', value: 'pool-balance' },
    { label: 'Token price', value: 'token-price' },
    { label: 'Asset list', value: 'asset-list' },
    ...(holdersReport === true ? [{ label: 'Holders', value: 'holders' as Report }] : []),
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
        onChange={(event) => {
          if (event.target.value) {
            setReport(event.target.value as Report)
          }
        }}
      />

      {!['holders', 'asset-list'].includes(report) && (
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
        <Select
          name="loanStatus"
          label="Status"
          options={[
            {
              label: 'All',
              value: 'all',
            },
            {
              label: 'Active',
              value: 'Active',
            },
            {
              label: 'Repaid',
              value: 'Repaid',
            },
            {
              label: 'Overdue',
              value: 'Overdue',
            },
          ]}
          value={loanStatus}
          onChange={(event) => {
            setLoanStatus(event.target.value)
          }}
        />
      )}

      {(report === 'holders' || report === 'investor-tx') && (
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
      {['investor-tx', 'holders'].includes(report) && (
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
        <AnchorButton href={csvData?.dataUrl} download={csvData?.fileName} variant="primary" small disabled={!csvData}>
          Export CSV
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
