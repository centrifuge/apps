import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
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
import * as React from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { useBasePath } from '../../utils/useBasePath'
import { SimpleBarChart } from '../Charts/SimpleBarChart'
import { GroupBy, ReportContext } from './ReportContext'

interface StyledButtonProps {
  selected?: boolean
}

const StyledButton = styled(Button)<StyledButtonProps>`
  margin-right: 12px;
  & > span {
    border-color: ${({ selected, theme }) => (selected ? 'transparent' : theme.colors.backgroundInverted)};
  }
  &:hover > span {
    border-color: ${({ selected, theme }) => (selected ? 'transparent' : theme.colors.backgroundInverted)};
    color: ${({ selected, theme }) => (!selected ? theme.colors.textPrimary : theme.colors.textInverted)};
  }
`

type ReportFilterProps = {
  pool: Pool
}

export function ReportFilter({ pool }: ReportFilterProps) {
  const { csvData, setStartDate, startDate, endDate, setEndDate, groupBy, setGroupBy, report, reportData } =
    React.useContext(ReportContext)
  const navigate = useNavigate()
  const basePath = useBasePath()

  const transformDataChart = React.useMemo(() => {
    if (report === 'balance-sheet') {
      return reportData.map((data: { timestamp: string; netAssetValue: CurrencyBalance }) => ({
        name: data.timestamp,
        yAxis: new CurrencyBalance(data.netAssetValue, pool.currency.decimals).toDecimal().toNumber(),
      }))
    }
  }, [report, reportData])

  return (
    <Shelf
      padding={2}
      marginX={[1, 6]}
      marginY={2}
      borderRadius={6}
      borderStyle="solid"
      borderColor="borderPrimary"
      borderWidth={[0, 1]}
      flexDirection="column"
    >
      <Shelf alignItems="center" flexWrap="wrap" justifyContent="space-between" width="100%">
        <Box display="flex">
          <StyledButton
            selected={report === 'balance-sheet'}
            variant={report === 'balance-sheet' ? 'secondary' : 'tertiary'}
            icon={<IconBalanceSheet />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/balance-sheet`)}
          >
            Balance sheet
          </StyledButton>
          <StyledButton
            selected={report === 'profit-and-loss'}
            variant={report === 'profit-and-loss' ? 'secondary' : 'tertiary'}
            icon={<IconProfitAndLoss />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/profit-and-loss`)}
          >
            Profit & loss
          </StyledButton>
          <StyledButton
            selected={report === 'cash-flow-statement'}
            variant={report === 'cash-flow-statement' ? 'secondary' : 'tertiary'}
            icon={<IconCashflow />}
            onClick={() => navigate(`${basePath}/${pool.id}/reporting/cash-flow-statement`)}
          >
            Cash flow
          </StyledButton>
        </Box>

        <Box display="flex">
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
            icon={<IconDownload />}
            small
            variant="inverted"
          >
            CSV
          </AnchorButton>
        </Box>
      </Shelf>
      <Box mt={4} width="100%" height={200} marginLeft="-50px">
        <SimpleBarChart data={transformDataChart} currency={pool.currency} />
      </Box>
    </Shelf>
  )
}
