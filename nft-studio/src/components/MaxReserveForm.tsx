import { Balance } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { useLiquidityAdmin } from '../utils/usePermissions'
import { usePool } from '../utils/usePools'

type Props = {
  poolId: string
}

export const MaxReserveForm: React.VFC<Props> = ({ poolId }) => {
  const address = useAddress()
  const isLiquidityAdmin = useLiquidityAdmin(poolId)
  const pool = usePool(poolId)

  const { execute: setMaxReserveTx, isLoading } = useCentrifugeTransaction(
    'Set max reserve',
    (cent) => cent.pools.setMaxReserve
  )

  const form = useFormik<{ maxReserve: number }>({
    initialValues: {
      maxReserve: 0,
    },
    onSubmit: (values, actions) => {
      setMaxReserveTx([poolId, Balance.fromFloat(values.maxReserve)])
      actions.setSubmitting(false)
      values.maxReserve = 0
    },
  })

  if (!address || !isLiquidityAdmin) return null

  return (
    <Stack as={Card} gap={2} p={2} mt={5}>
      <Shelf justifyContent="space-between">
        <Text variant="heading3">Maximum reserve</Text>
        <Text variant="heading3">{formatBalance(pool?.reserve.max.toDecimal() || 0, pool?.currency || '')}</Text>
      </Shelf>
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="maxReserve" validate={(value: number) => value <= 0 && 'Value too small'}>
              {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
                <CurrencyInput
                  {...fieldProps}
                  value={value}
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
