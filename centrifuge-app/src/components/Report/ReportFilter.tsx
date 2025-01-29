import { Pool } from '@centrifuge/centrifuge-js'
import {
  AnchorButton,
  Box,
  Button,
  DateInput,
  IconBalanceSheet,
  IconCashflow,
  IconDownload,
  IconProfitAndLoss,
  Select,
  Shelf,
} from '@centrifuge/fabric'
import { BalanceSheetReport, CashflowReport, ProfitAndLossReport } from '@centrifuge/sdk/dist/types/reports'
import * as React from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { usePool } from '../../../src/utils/usePools'
import { useBasePath } from '../../utils/useBasePath'
import { SimpleBarChart } from '../Charts/SimpleBarChart'
import { GroupBy, ReportContext } from './ReportContext'

interface StyledButtonProps {
  selected?: boolean
}

const StyledButton = styled(Button)<StyledButtonProps>`
  margin-bottom: 12px;
  margin-right: 12px;
  @media (min-width: ${({ theme }) => theme.breakpoints['M']}) {
    margin-bottom: 0;
  }
  & > span {
    border-width: 1px;
    border-color: ${({ selected }) => (selected ? 'transparent' : '#B7B7B7')};
  }
  &:hover > span {
    border-color: ${({ selected, theme }) => (selected ? 'transparent' : theme.colors.backgroundInverted)};
    color: ${({ selected, theme }) => (!selected ? theme.colors.textPrimary : theme.colors.textInverted)};
  }
`

type ReportFilterProps = {
  poolId: string
}

export function ReportFilter({ poolId }: ReportFilterProps) {
  const { csvData, setStartDate, startDate, endDate, setEndDate, groupBy, setGroupBy, report, reportData } =
    React.useContext(ReportContext)
  const navigate = useNavigate()
  const basePath = useBasePath()
  const pool = usePool(poolId) as Pool

  const transformDataChart = React.useMemo(() => {
    if (!reportData.length) return
    if (report === 'balance-sheet') {
      return (reportData as BalanceSheetReport[]).map((data) => ({
        name: data.timestamp,
      }))
    } else if (report === 'profit-and-loss') {
      return (reportData as ProfitAndLossReport[]).map((data) => ({
        name: data.timestamp,
        yAxis: data.totalProfitAndLoss?.toDecimal(),
      }))
    } else {
      return (reportData as CashflowReport[])
        .filter((data) => !data.totalCashflow?.isZero())
        .map((data) => {
          return {
            name: data.timestamp,
            yAxis: data.totalCashflow?.toDecimal(),
          }
        })
    }
  }, [report, reportData])

  return (
    <Shelf
      padding={2}
      margin={2}
      borderRadius={6}
      borderStyle="solid"
      borderColor="borderPrimary"
      borderWidth={[0, 1]}
      flexDirection="column"
    >
      <Shelf alignItems="center" flexWrap="wrap" justifyContent="space-between" width="100%">
        <Shelf flexDirection={['column', 'row']}>
          <StyledButton
            selected={report === 'balance-sheet'}
            variant={report === 'balance-sheet' ? 'secondary' : 'tertiary'}
            icon={<IconBalanceSheet size={18} />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/balance-sheet`)}
          >
            Balance sheet
          </StyledButton>
          <StyledButton
            selected={report === 'profit-and-loss'}
            variant={report === 'profit-and-loss' ? 'secondary' : 'tertiary'}
            icon={<IconProfitAndLoss size={18} />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/profit-and-loss`)}
          >
            Profit & loss
          </StyledButton>
          <StyledButton
            selected={report === 'cash-flow-statement'}
            variant={report === 'cash-flow-statement' ? 'secondary' : 'tertiary'}
            icon={<IconCashflow size={18} />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/cash-flow-statement`)}
          >
            Cash flow
          </StyledButton>
        </Shelf>

        <Shelf flexDirection={['column', 'row']}>
          <Box marginRight={2}>
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
          </Box>
          <Box marginRight={2}>
            {groupBy === 'day' && (
              <DateInput row label="Day" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            )}
          </Box>
          {groupBy === 'month' || groupBy === 'daily' ? (
            <>
              <Box marginRight={2}>
                <DateInput
                  row
                  label="From"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Box>
              <Box marginRight={2}>
                <DateInput
                  row
                  label="To"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
            </>
          ) : null}
          <AnchorButton
            disabled={!csvData}
            download={csvData?.fileName}
            href={csvData?.dataUrl}
            icon={<IconDownload size={18} />}
            small
            variant="inverted"
          >
            Download
          </AnchorButton>
        </Shelf>
      </Shelf>
      {!!transformDataChart?.length && (
        <Box mt={4} width="100%" height={200} marginLeft="-50px">
          <SimpleBarChart data={transformDataChart} currency={pool.currency} />
        </Box>
      )}
    </Shelf>
  )
}
