import { Pool } from '@centrifuge/centrifuge-js'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { CurrencyInput, IconButton, IconMinusCircle, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { Dec } from '../../utils/Decimal'
import { formatPercentage } from '../../utils/formatting'
import { usePoolFees, usePoolMetadata } from '../../utils/usePools'
import { FinanceValues } from './ExternalFinanceForm'

export const FeesFields = ({ pool }: { pool: Pool }) => {
  const form = useFormikContext<FinanceValues>()
  const { data: poolMetadata } = usePoolMetadata(pool)
  const poolFees = usePoolFees(pool.id)
  const chargableFees = poolFees?.filter((fee) => fee.type !== 'fixed')
  return (
    <Stack gap={2}>
      <FieldArray name="fees">
        {({ remove, push }) => {
          return (
            <Stack gap={2}>
              <Select
                options={[
                  { label: 'Select fees', value: '', disabled: true },
                  ...(chargableFees || []).map((fee) => {
                    const feeName =
                      poolMetadata?.pool?.poolFees?.find((feeMeta) => feeMeta.id === fee.id)?.name || 'Unknown Fee'
                    return {
                      label: `${feeName} - ${fee.amounts.percentOfNav.toPercent().toString()}%`,
                      value: fee.id.toString(),
                    }
                  }),
                ]}
                defaultValue={''}
                label="Fees"
                onChange={(e) => {
                  push({ id: e.target.value, amount: '' })
                }}
              />
              <Stack gap={2}>
                {form.values.fees.map((fee, index) => {
                  const poolFee = poolFees?.find((poolFee) => poolFee.id.toString() === fee.id)
                  const maxCharge = poolFee?.amounts.percentOfNav.toPercent().mul(pool.nav.aum.toDecimal())
                  return (
                    <Field
                      key={`fees.${index}.amount`}
                      name={`fees.${index}.amount`}
                      validate={(value: number) => {
                        let error
                        if (!value) {
                          error = 'Enter an amount or remove the fee'
                        }
                        if (value && Dec(value).gt(maxCharge || 0)) {
                          error = `Amount cannot exceed ${formatBalance(maxCharge || 0, pool.currency.symbol)}`
                        }
                        return error
                      }}
                    >
                      {({ field, meta }: FieldProps) => {
                        return (
                          <Stack as="label" gap={1} width="100%" htmlFor={`fees.${index}.amount`}>
                            <Text variant="label2">
                              {poolMetadata?.pool?.poolFees?.find((f) => f.id.toString() === fee.id)?.name} -{' '}
                              {poolFees
                                ?.find((f) => f.id.toString() === fee.id)
                                ?.amounts.percentOfNav.toPercent()
                                .toString()}
                              %
                            </Text>
                            <Shelf alignItems="center" gap={2} width="100%" justifyContent="space-between">
                              <CurrencyInput
                                {...field}
                                errorMessage={(meta.touched && meta.error) || undefined}
                                currency={pool.currency.symbol}
                                placeholder="Amount"
                                onChange={(value) => form.setFieldValue(`fees.${index}.amount`, value)}
                                secondaryLabel={`Maximum charge ${formatBalance(
                                  maxCharge || 0,
                                  pool.currency.symbol
                                )} (${formatPercentage(poolFee?.amounts.percentOfNav.toPercent() || 0)} NAV)`}
                              />
                              <IconButton onClick={() => remove(index)} title="Remove fee">
                                <IconMinusCircle />
                              </IconButton>
                            </Shelf>
                          </Stack>
                        )
                      }}
                    </Field>
                  )
                })}
              </Stack>
            </Stack>
          )
        }}
      </FieldArray>
    </Stack>
  )
}
