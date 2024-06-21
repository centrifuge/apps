import { ActiveLoan, CreatedLoan, CurrencyBalance, ExternalLoan } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Drawer, IconDownload, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import { Field, FieldProps, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import daiLogo from '../../assets/images/dai-logo.svg'
import usdcLogo from '../../assets/images/usdc-logo.svg'
import { ButtonGroup } from '../../components/ButtonGroup'
import { DataCol, DataRow, DataTable } from '../../components/DataTable'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetName } from '../../components/LoanList'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { usePool } from '../../utils/usePools'
import { usePoolsForWhichAccountIsFeeder } from '../../utils/usePoolsForWhichAccountIsFeeder'
import { positiveNumber } from '../../utils/validation'
import { isCashLoan, isExternalLoan } from '../Loan/utils'

type FormValues = {
  feed: {
    formIndex: number
    id: string
    oldValue: number
    value: number | ''
    isin: string
    quantity: number
    maturity: string
    currentPrice: number
    withLinearPricing: boolean
  }[]
  closeEpoch: boolean
}
type Row = FormValues['feed'][0] | ActiveLoan | CreatedLoan

export function NavManagementAssetTable({ poolId }: { poolId: string }) {
  const allowedPools = usePoolsForWhichAccountIsFeeder()
  const isFeeder = !!allowedPools?.find((p) => p.id === poolId)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)

  const pool = usePool(poolId, false)
  const [allLoans] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    enabled: !!poolId && !!pool,
  })

  const externalLoans = React.useMemo(
    () => (allLoans?.filter((l) => isExternalLoan(l) && l.status !== 'Closed') as ExternalLoan[]) ?? [],
    [allLoans]
  )

  const cashLoans =
    (allLoans?.filter((l) => isCashLoan(l) && l.status !== 'Closed') as (CreatedLoan | ActiveLoan)[]) ?? []
  const api = useCentrifugeApi()

  const reserveRow = [
    {
      id: 'reserve',
      isin: 'Reserve',
      quantity: 1,
      currentPrice: 0,
      value: pool?.reserve.total.toDecimal().toNumber(),
      formIndex: -1,
      maturity: '',
      oldValue: '',
    },
  ]

  const { execute, isLoading } = useCentrifugeTransaction(
    'Set oracle prices',
    (cent) => (args: [values: FormValues], options) => {
      const [values] = args
      const batch = [
        ...values.feed
          .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
          .map((f) => {
            const feed = f.isin ? { Isin: f.isin } : { poolloanid: [poolId, f.id] }
            return api.tx.oraclePriceFeed.feed(feed, CurrencyBalance.fromFloat(f.value, 18))
          }),
        api.tx.oraclePriceCollection.updateCollection(poolId),
        api.tx.loans.updatePortfolioValuation(poolId),
      ]
      if (values.closeEpoch) {
        batch.push(api.tx.poolSystem.closeEpoch(poolId))
      }
      const tx = api.tx.utility.batchAll(batch)
      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  const initialValues = React.useMemo(
    () => ({
      feed:
        externalLoans?.map((l, i) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return {
            formIndex: i,
            id: l.id,
            oldValue: latestOraclePrice.value.toFloat(),
            value: l.status === 'Active' ? l?.currentPrice.toDecimal().toNumber() : 0,
            isin: 'isin' in l.pricing.priceId ? l.pricing.priceId.isin : '',
            quantity: l.pricing.outstandingQuantity.toFloat(),
            maturity: formatDate(l.pricing.maturityDate),
            withLinearPricing: l.pricing.withLinearPricing,
            currentPrice: l.status === 'Active' ? l?.currentPrice.toDecimal().toNumber() : 0,
          }
        }) ?? [],
      closeEpoch: false,
    }),
    [externalLoans]
  )

  const form = useFormik<FormValues>({
    initialValues,
    onSubmit(values, actions) {
      execute([values])
      actions.setSubmitting(false)
    },
  })

  React.useEffect(() => {
    if (isEditing && !isLoading) return
    form.resetForm()
    form.setValues(initialValues, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, isEditing, isLoading])

  const poolReserve = pool?.reserve.total.toDecimal().toNumber() || 0
  const newNavExternal = form.values.feed.reduce(
    (acc, cur) => acc + cur.quantity * (isEditing && cur.value ? cur.value : cur.oldValue),
    0
  )
  const newNavCash = cashLoans.reduce((acc, cur) => acc + cur.outstandingDebt.toFloat(), 0)
  const newNav = newNavExternal + newNavCash + poolReserve
  const isTinlakePool = poolId.startsWith('0x')

  const columns = [
    {
      align: 'left',
      header: 'Asset',
      cell: (row: Row) =>
        'oldValue' in row ? (
          <Shelf gap={1} height={40}>
            {row.id === 'reserve' ? (
              <Shelf height="24px" width="24px" alignItems="center" justifyContent="center">
                <Box as="img" src={isTinlakePool ? daiLogo : usdcLogo} alt="" height="13px" width="13px" />
              </Shelf>
            ) : (
              <Thumbnail type="asset" label={row.id} />
            )}
            <Text variant="body2" fontWeight={600}>
              {row.isin || row.id}
            </Text>
          </Shelf>
        ) : (
          <Shelf height={40}>
            <AssetName loan={row} />
          </Shelf>
        ),
    },
    {
      align: 'left',
      header: 'Maturity date',
      cell: (row: Row) => ('oldValue' in row ? row.maturity : ''),
    },
    {
      align: 'left',
      header: 'Linear pricing',
      width: '100px',
      cell: (row: Row) => (row.id === 'reserve' ? '' : 'oldValue' in row && row.withLinearPricing ? 'Yes' : 'No'),
    },
    {
      align: 'right',
      header: 'Quantity',
      cell: (row: Row) =>
        row.id !== 'reserve' ? formatBalance('oldValue' in row ? row.quantity : row.outstandingDebt) : '',
    },
    {
      align: 'right',
      header: 'Asset price',
      cell: (row: Row) =>
        row.id !== 'reserve' ? formatBalance('oldValue' in row ? row.oldValue : 1, pool?.currency.displayName, 8) : '',
    },
    {
      align: 'right',
      header: 'New price',
      cell: (row: Row) => {
        return 'oldValue' in row && row.id !== 'reserve' && isEditing ? (
          <Field name={`feed.${row.formIndex}.value`} validate={positiveNumber()}>
            {({ field, meta, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                placeholder={row.oldValue.toString()}
                errorMessage={meta.touched ? meta.error : undefined}
                currency={pool?.currency.displayName}
                onChange={(value) => form.setFieldValue(`feed.${row.formIndex}.value`, value)}
                value={field.value}
                onClick={(e) => e.preventDefault()}
              />
            )}
          </Field>
        ) : (
          ''
        )
      },
    },
    {
      align: 'right',
      header: 'Value',
      cell: (row: Row) => {
        const newValue =
          'value' in row && !Number.isNaN(row.value) && typeof row.value === 'number' && isEditing
            ? row.value
            : undefined
        return 'oldValue' in row
          ? formatBalance(row.quantity * (newValue ?? row.oldValue), pool?.currency.symbol)
          : formatBalance(row.outstandingDebt, pool?.currency.symbol)
      },
    },
  ]

  if (!isEditing) {
    columns.splice(5, 1)
  }

  return (
    <Stack pb={8}>
      <FormikProvider value={form}>
        <Drawer isOpen={isConfirming} onClose={() => setIsConfirming(false)}>
          <ButtonGroup>
            <Button
              onClick={() => {
                form.submitForm()
                setIsConfirming(false)
              }}
            >
              Confirm NAV
            </Button>
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
          </ButtonGroup>
        </Drawer>
        <LayoutSection
          title="Assets"
          pt={5}
          headerRight={
            isEditing ? (
              <ButtonGroup variant="small" key="editing">
                <Button variant="secondary" onClick={() => setIsEditing(false)} small>
                  Cancel
                </Button>
                <Button
                  small
                  onClick={() => setIsConfirming(true)}
                  loading={isLoading || form.isSubmitting}
                  loadingMessage={isLoading ? 'Pending...' : undefined}
                  disabled={!isFeeder}
                >
                  Done
                </Button>
              </ButtonGroup>
            ) : (
              <ButtonGroup variant="small" key="edit">
                <Button variant="tertiary" small icon={IconDownload}>
                  Download
                </Button>
                <Button onClick={() => setIsEditing(true)} small>
                  Edit
                </Button>
              </ButtonGroup>
            )
          }
        >
          <DataTable
            data={[...reserveRow, ...cashLoans, ...form.values.feed]}
            columns={columns}
            onRowClicked={(row) =>
              row.id !== 'reserve' ? `/issuer/${pool?.id}/assets/${row.id}` : `/nav-management/${pool?.id}`
            }
            footer={
              <DataRow>
                <DataCol align="left">
                  <Text color="accentPrimary" variant="body2">
                    Total
                  </Text>
                </DataCol>
                <DataCol />
                <DataCol />
                <DataCol />
                <DataCol />
                {isEditing && <DataCol />}
                <DataCol>
                  <Text color="accentPrimary" variant="body2">
                    {formatBalance(newNav, pool?.currency.symbol)}
                  </Text>
                </DataCol>
              </DataRow>
            }
          />
        </LayoutSection>
      </FormikProvider>
    </Stack>
  )
}
