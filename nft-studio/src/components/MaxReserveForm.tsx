import { Balance } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikErrors, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useLiquidityAdmin } from '../utils/usePermissions'
import { usePool } from '../utils/usePools'
import { LoadBoundary } from './LoadBoundary'

type Props = {
  poolId: string
}

export const MaxReserveForm: React.VFC<Props> = (props) => {
  return (
    <LoadBoundary>
      <MaxReserveInner {...props} />
    </LoadBoundary>
  )
}

type MaxReserveValues = {
  maxReserve: number | Decimal | ''
}

const MaxReserveInner: React.VFC<Props> = ({ poolId }) => {
  const address = useAddress()
  const isLiquidityAdmin = useLiquidityAdmin(poolId)
  const pool = usePool(poolId)

  const { execute: setMaxReserveTx, isLoading } = useCentrifugeTransaction(
    'Set max reserve',
    (cent) => cent.pools.setMaxReserve
  )

  const form = useFormik<{ maxReserve: number | Decimal }>({
    initialValues: {
      maxReserve: 0,
    },
    onSubmit: (values, actions) => {
      setMaxReserveTx([poolId, Balance.fromFloat(values.maxReserve)])
      actions.setSubmitting(false)
    },
    validate: (values) => {
      const errors: FormikErrors<MaxReserveValues> = {}

      if (validateNumberInput(values.maxReserve)) {
        errors.maxReserve = validateNumberInput(values.maxReserve)
      }
      return errors
    },
  })

  if (!address || !isLiquidityAdmin) return null

  return (
    <Stack as={Card} gap={2} p={2} mt={5}>
      <Shelf justifyContent="space-between">
        <Text variant="heading3">Maximum Reserve</Text>
        <Text variant="heading3">{formatBalance(pool?.reserve.max.toDecimal() || 0, pool?.currency || '')}</Text>
      </Shelf>
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="maxReserve">
              {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
                <CurrencyInput
                  {...fieldProps}
                  value={value instanceof Decimal ? value.toNumber() : value}
                  errorMessage={meta.touched ? meta.error : undefined}
                  label="Maximum reserve"
                  type="number"
                  min="0"
                  disabled={isLoading}
                  currency={getCurrencySymbol(pool?.currency)}
                />
              )}
            </Field>
            <Button type="submit" loading={isLoading} loadingMessage={'Confirming'}>
              Set
            </Button>
          </Stack>
        </Form>
      </FormikProvider>
    </Stack>
  )
}

function validateNumberInput(value: number | string | Decimal) {
  console.log('🚀 ~ Dec(value).lessThanOrEqualTo(Dec(0))', Dec(value).lessThanOrEqualTo(Dec(0)))
  if (value === '') {
    return 'Not a valid number'
  }
  if (Dec(value).lessThanOrEqualTo(Dec(0))) {
    return 'Value too small'
  }
}
