import { Balance } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { getCurrencySymbol } from '../utils/formatting'
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
    (cent) => cent.pools.setMaxReserve,
    { onSuccess: () => form.resetForm() }
  )

  const form = useFormik<{ maxReserve: string | undefined }>({
    initialValues: {
      maxReserve: undefined,
    },
    onSubmit: (values, actions) => {
      if (values.maxReserve) {
        setMaxReserveTx([poolId, Balance.fromFloat(values.maxReserve)])
      } else {
        actions.setErrors({ maxReserve: 'Invalid number' })
      }
      actions.setSubmitting(false)
    },
  })

  if (!address || !isLiquidityAdmin) return null

  return (
    <Stack as={Card} gap={2} p={2} mt={5}>
      <Shelf justifyContent="space-between">
        <Text variant="heading3">Maximum reserve</Text>
      </Shelf>
      <FormikProvider value={form}>
        <Form noValidate>
          <Stack gap="2">
            <Field name="maxReserve">
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    initialValue={pool?.reserve.max.toDecimal().toNumber()}
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isLoading}
                    currency={getCurrencySymbol(pool?.currency)}
                    handleChange={(value) => form.setFieldValue('maxReserve', value)}
                  />
                )
              }}
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
