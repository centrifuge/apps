import { CurrencyBalance, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Box, Button, Divider, Grid, Stack, Text } from '@centrifuge/fabric'
import { Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '../../../../src/components/DataTable'
import { AssetName } from '../../../../src/components/LoanList'
import { formatDate } from '../../../../src/utils/date'
import { formatBalance } from '../../../../src/utils/formatting'
import { useLoans } from '../../../../src/utils/useLoans'
import { TransformedLoan, useLoanCalculations } from '../utils'
import { EditableTableField } from './EditableTableField'

type Row = {
  loan: Loan | TinlakeLoan
  quantity: CurrencyBalance
  currentPrice: CurrencyBalance
  newPrice: number
  newValue: number
}

type FormValues = {
  [key: string]: string | number
}

export default function AssetsSection({ pool }: { pool: Pool }) {
  const { data: loans, isLoading } = useLoans([pool.id])
  const [update, setUpdate] = useState(false)
  const isTinlakePool = pool.id.startsWith('0x')

  // Needs to update when selecting a new pool
  useEffect(() => {
    setUpdate(false)
  }, [loans])

  const loansWithPool = loans?.map((loan) => ({
    ...loan,
    pool,
  }))

  const { totalAssets } = useLoanCalculations(loansWithPool as TransformedLoan[])
  const totalAum = pool.nav.aum.toDecimal().add(pool.reserve.total.toDecimal())

  const initialValues =
    loans?.map((loan) => {
      const quantity =
        'outstandingQuantity' in loan.pricing ? loan.pricing.outstandingQuantity.toDecimal().toNumber() : 0
      const currentPrice =
        loan.status === 'Active' ? ('currentPrice' in loan ? loan?.currentPrice.toDecimal().toNumber() : 0) : 0
      return {
        [`quantity-${loan.id}`]: 'outstandingQuantity' in loan.pricing && loan.pricing.outstandingQuantity,
        [`currentPrice-${loan.id}`]:
          loan.status === 'Active' ? ('currentPrice' in loan ? loan?.currentPrice.toDecimal().toNumber() : 0) : '-',
        [`newPrice-${loan.id}`]: quantity * currentPrice,
        [`newValue-${loan.id}`]: 0,
      }
    }) || {}

  console.log(initialValues)

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit: (values) => {
      console.log(values)
    },
  })

  const columns = [
    {
      align: 'left',
      header: isTinlakePool ? 'NFT ID' : 'Asset',
      cell: ({ loan }: Row) => {
        return <AssetName loan={loan} />
      },
    },
    {
      align: 'left',
      header: 'Quantity',
      cell: ({ loan }: Row) => (
        <Text variant="body3">
          {'outstandingQuantity' in loan.pricing ? formatBalance(loan.pricing.outstandingQuantity) : '-'}
        </Text>
      ),
    },
    {
      align: 'left',
      header: 'Current price (USDC)',
      cell: ({ currentPrice }: Row) => <Text variant="body3">{currentPrice}</Text>,
    },
    {
      align: 'left',
      header: 'New price (USDC)',
      cell: ({ loan }: Row) => {
        return <EditableTableField name={`newPrice-${loan.id}`} />
      },
    },
    {
      align: 'left',
      header: 'New value (USDC)',
      cell: () => {
        return <Text variant="body3">{formatBalance(0)}</Text>
      },
    },
  ]

  const data = useMemo(() => {
    return loans?.map((loan) => ({
      loan,
      quantity: 'outstandingQuantity' in loan.pricing && loan.pricing.outstandingQuantity,
      currentPrice:
        loan.status === 'Active' ? ('currentPrice' in loan ? loan?.currentPrice.toDecimal().toNumber() : 0) : '-',
    }))
  }, [loansWithPool])

  if (isLoading) return null

  return (
    <FormikProvider value={form}>
      <Form>
        <Box backgroundColor="backgroundSecondary" borderRadius={8} p={2} mt={3}>
          <Box display="flex" justifyContent="space-between">
            <Text variant="heading1">Assets</Text>
            <Text variant="heading1">{formatBalance(totalAssets)} USDC</Text>
          </Box>
          <Stack
            backgroundColor="backgroundPage"
            borderRadius={8}
            p={2}
            mt={3}
            border="1px solid"
            borderColor="borderPrimary"
            gap={2}
          >
            <Text variant="heading4">Assets prices and NAV</Text>
            <Divider color="borderPrimary" />
            <Grid gridTemplateColumns={['1fr', '1fr 1fr 1fr 1fr 150px']} gap={2}>
              <Stack gap={1}>
                <Text variant="body3">Current NAV</Text>
                <Text variant="heading1">{formatBalance(totalAum)} USDC</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">Change in valuation</Text>
                <Text variant="heading1">0</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">New NAV</Text>
                <Text variant="heading1">0</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">Last updated</Text>
                <Text variant="heading1">{formatDate(pool.nav.lastUpdated)}</Text>
              </Stack>
              {!update && (
                <Button variant="secondary" small onClick={() => setUpdate(true)} disabled={!loansWithPool?.length}>
                  Update
                </Button>
              )}
            </Grid>
          </Stack>
          {update && (
            <Stack
              backgroundColor="backgroundPage"
              borderRadius={8}
              p={2}
              mt={3}
              border="1px solid"
              borderColor="borderPrimary"
              gap={2}
            >
              <Text variant="heading4">Update assets prices</Text>
              <Divider color="borderPrimary" />
              <DataTable data={data} columns={columns} />
            </Stack>
          )}
        </Box>
      </Form>
    </FormikProvider>
  )
}
