import { CurrencyBalance, Pool, addressToHex } from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  formatBalance,
  useCentrifuge,
  useCentrifugeApi,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, CurrencyInput, IconPlus, IconX, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import React from 'react'
import { combineLatest, map, of } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { useBorrower } from '../../utils/usePermissions'
import { usePool, usePoolFees, usePoolMetadata } from '../../utils/usePools'
import { FinanceValues } from './ExternalFinanceForm'
import { RepayValues } from './RepayForm'

export const ChargeFeesFields = ({
  pool,
  borrower,
}: {
  pool: Pool
  borrower: CombinedSubstrateAccount | undefined
}) => {
  const form = useFormikContext<FinanceValues>()
  const { data: poolMetadata } = usePoolMetadata(pool)
  const poolFees = usePoolFees(pool.id)
  // fees can only be charged by the destination address
  // fees destination must be set to the AO Proxy address
  const chargableFees = React.useMemo(
    () =>
      poolFees?.filter(
        (fee) => fee.type !== 'fixed' && borrower && addressToHex(fee.destination) === borrower.actingAddress
      ),
    [poolFees, borrower]
  )

  const getOptions = React.useCallback(() => {
    const chargableOptions = (chargableFees || []).map((f) => {
      const feeName = poolMetadata?.pool?.poolFees?.find((feeMeta) => feeMeta.id === f.id)?.name || 'Unknown Fee'
      return {
        label: `${feeName}`,
        value: f.id.toString(),
      }
    })
    return chargableFees && chargableFees.length > 1
      ? [{ label: 'Select fee', value: '' }, ...chargableOptions]
      : chargableOptions
  }, [chargableFees, poolMetadata])

  return (
    <Stack gap={2}>
      <FieldArray name="fees">
        {({ remove, push }) => {
          return (
            <>
              <Stack gap={2}>
                <Stack gap={2}>
                  {form.values.fees.map((fee, index) => {
                    return (
                      <Shelf key={`${fee.id}-${index}`} gap={1} alignItems="flex-start">
                        <Box flex={1}>
                          <Select
                            options={getOptions()}
                            label="Fee"
                            onChange={(e) => {
                              form.setFieldValue(`fees.${index}.id`, e.target.value)
                            }}
                            value={form.values.fees[index].id}
                          />
                        </Box>
                        <Box flex={1}>
                          <Field
                            key={`fees.${index}.amount`}
                            name={`fees.${index}.amount`}
                            validate={(value: number) => {
                              let error
                              if (!value) {
                                error = 'Enter an amount or remove the fee'
                              }
                              return error
                            }}
                          >
                            {({ field, meta }: FieldProps) => {
                              return (
                                <CurrencyInput
                                  {...field}
                                  label="Amount"
                                  errorMessage={meta.touched ? meta.error : undefined}
                                  currency={pool.currency.symbol}
                                  placeholder="0"
                                  onChange={(value) => form.setFieldValue(`fees.${index}.amount`, value)}
                                />
                              )
                            }}
                          </Field>
                        </Box>
                        <Box
                          alignSelf="flex-start"
                          background="none"
                          border="none"
                          as="button"
                          mt="34px"
                          style={{ cursor: 'pointer' }}
                          onClick={() => remove(index)}
                        >
                          <IconX size={20} color="textSecondary" />
                        </Box>
                      </Shelf>
                    )
                  })}
                </Stack>
                {chargableFees?.length ? (
                  <Shelf
                    gap={1}
                    alignItems="center"
                    as="button"
                    style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                    onClick={(e) => {
                      e.preventDefault()
                      if (chargableFees.length === 1) {
                        return push({ id: chargableFees[0].id.toString(), amount: '' })
                      }
                      return push({ id: '', amount: '' })
                    }}
                  >
                    <IconPlus size={20} color="textSecondary" />
                    <Text variant="label1" color="textButtonTertiary">
                      Add fee
                    </Text>
                  </Shelf>
                ) : null}
              </Stack>
            </>
          )
        }}
      </FieldArray>
    </Stack>
  )
}

function ChargePoolFeeSummary({ poolId }: { poolId: string }) {
  const form = useFormikContext<FinanceValues | RepayValues>()
  const pool = usePool(poolId)
  const totalFees = form.values.fees.reduce((acc, fee) => acc.add(Dec(fee.amount || 0)), Dec(0))

  return form.values.fees.length > 0 ? (
    <Stack gap={1}>
      <Shelf justifyContent="space-between">
        <Text variant="body2" color="textSecondary">
          Fees
        </Text>
        <Text variant="body2">{formatBalance(Dec(totalFees), pool.currency.symbol, 2)}</Text>
      </Shelf>
    </Stack>
  ) : null
}

export function useChargePoolFees(poolId: string, loanId: string) {
  const pool = usePool(poolId)
  const borrower = useBorrower(poolId, loanId)
  const api = useCentrifugeApi()
  const cent = useCentrifuge()
  return {
    render: () => <ChargeFeesFields pool={pool as Pool} borrower={borrower} />,
    renderSummary: () => <ChargePoolFeeSummary poolId={poolId} />,
    isValid: ({ values }: { values: Pick<FinanceValues | RepayValues, 'fees'> }) => {
      return values.fees.every((fee) => !!fee.id && !!fee.amount)
    },
    getBatch: ({ values }: { values: Pick<FinanceValues | RepayValues, 'fees'> }) => {
      if (!values.fees.length) return of([])
      const fees = values.fees.flatMap((fee) => {
        if (!fee.amount) throw new Error('Charge amount not provided')
        if (!borrower) throw new Error('No borrower')
        const feeAmount = CurrencyBalance.fromFloat(fee.amount, pool.currency.decimals)
        let feeTx = api.tx.poolFees.chargeFee(fee.id, feeAmount.toString())
        return cent.remark
          .remark([[{ Loan: [poolId, loanId] }], feeTx], { batch: true })
          .pipe(map((tx) => wrapProxyCallsForAccount(api, tx, borrower, 'Borrow')))
      })
      return combineLatest(fees)
    },
  }
}
