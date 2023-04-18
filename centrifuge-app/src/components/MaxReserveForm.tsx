import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useSuitableAccounts } from '../utils/usePermissions'
import { usePool } from '../utils/usePools'

type Props = {
  poolId: string
}

export function MaxReserveForm({ poolId }: Props) {
  const [account] = useSuitableAccounts({ poolId, poolRole: ['LiquidityAdmin'] })
  const pool = usePool(poolId)

  const { execute: setMaxReserveTx, isLoading } = useCentrifugeTransaction(
    'Set max reserve',
    (cent) => cent.pools.setMaxReserve,
    { onSuccess: () => form.resetForm() }
  )

  const form = useFormik<{ maxReserve: number | '' }>({
    initialValues: {
      maxReserve: '',
    },
    onSubmit: (values, actions) => {
      if (values.maxReserve) {
        setMaxReserveTx([poolId, CurrencyBalance.fromFloat(values.maxReserve, pool.currency.decimals)], { account })
      } else {
        actions.setErrors({ maxReserve: 'Invalid number' })
      }
      actions.setSubmitting(false)
    },
  })

  if (!account) return null

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
                  initialValue={pool?.reserve.max.toDecimal().toNumber()}
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
