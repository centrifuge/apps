import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useLiquidityAdmin } from '../utils/usePermissions'
import { usePool } from '../utils/usePools'

type Props = {
  poolId: string
}

export const MaxReserveForm: React.FC<Props> = ({ poolId }) => {
  const address = useAddress('substrate')
  const isLiquidityAdmin = useLiquidityAdmin(poolId)
  const pool = usePool(poolId)

  const { execute: setMaxReserveTx, isLoading } = useCentrifugeTransaction(
    'Set max reserve',
    (cent) => cent.pools.setMaxReserve,
    { onSuccess: () => form.resetForm() }
  )

  const form = useFormik<{ maxReserve: number | '' }>({
    initialValues: {
      maxReserve: pool?.reserve.max.toDecimal().toNumber() || '',
    },
    enableReinitialize: true,
    onSubmit: (values, actions) => {
      if (values.maxReserve) {
        setMaxReserveTx([poolId, CurrencyBalance.fromFloat(values.maxReserve, pool.currency.decimals)])
      } else {
        actions.setErrors({ maxReserve: 'Invalid number' })
      }
      actions.setSubmitting(false)
    },
  })

  if (!address || !isLiquidityAdmin) return null

  return (
    <Stack as={Card} gap={2} p={2}>
      <Shelf justifyContent="space-between">
        <Text variant="heading3">Maximum reserve</Text>
      </Shelf>
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="maxReserve">
              {({ field, meta, form }: FieldProps) => (
                <CurrencyInput
                  {...field}
                  initialValue={form.values.maxReserve || undefined}
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={pool?.currency.symbol}
                  onChange={(value) => form.setFieldValue('maxReserve', value)}
                />
              )}
            </Field>
            <Button type="submit" loading={isLoading} loadingMessage={'Confirming'}>
              Apply
            </Button>
          </Stack>
        </Form>
      </FormikProvider>
    </Stack>
  )
}
