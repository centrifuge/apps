import { CurrencyBalance, Pool, addressToHex } from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  formatBalance,
  useCentrifuge,
  useCentrifugeApi,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, IconMinusCircle, IconPlusCircle, Select, Shelf, Stack } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import { combineLatest, of } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { formatPercentage } from '../../utils/formatting'
import { useBorrower, useSuitableAccounts } from '../../utils/usePermissions'
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
  const chargableFees = poolFees?.filter(
    (fee) => fee.type !== 'fixed' && borrower && addressToHex(fee.destination) === borrower.actingAddress
  )
  return (
    <Stack gap={2}>
      <FieldArray name="fees">
        {({ remove, push }) => {
          return (
            <>
              <Stack gap={2}>
                <Stack gap={2}>
                  {form.values.fees.map((fee, index) => {
                    const poolFee = poolFees?.find((poolFee) => poolFee.id.toString() === fee.id)
                    const maxCharge = poolFee?.amounts.percentOfNav.toPercent().mul(pool.nav.aum.toDecimal())
                    return (
                      <Shelf gap={1} alignItems="flex-start">
                        <Box flex={1}>
                          <Select
                            options={[
                              { label: 'Select Fee', value: '' },
                              ...(chargableFees || []).map((f) => {
                                const feeName =
                                  poolMetadata?.pool?.poolFees?.find((feeMeta) => feeMeta.id === f.id)?.name ||
                                  'Unknown Fee'
                                return {
                                  label: `${feeName} - ${f.amounts.percentOfNav.toPercent().toString()}%`,
                                  value: f.id.toString(),
                                }
                              }),
                            ]}
                            defaultValue={''}
                            label="Fees"
                            onChange={(e) => {
                              form.setFieldValue(`fees.${index}.id`, e.target.value)
                            }}
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
                              if (value && Dec(value).gt(maxCharge || 0)) {
                                error = `Amount cannot exceed ${formatBalance(maxCharge || 0, pool.currency.symbol)}`
                              }
                              return error
                            }}
                          >
                            {({ field, meta }: FieldProps) => {
                              return (
                                <CurrencyInput
                                  {...field}
                                  label="Amount"
                                  errorMessage={(meta.touched && meta.error) || undefined}
                                  currency={pool.currency.symbol}
                                  placeholder="0"
                                  onChange={(value) => form.setFieldValue(`fees.${index}.amount`, value)}
                                  secondaryLabel={`Max ${formatBalance(
                                    maxCharge || 0,
                                    pool.currency.symbol
                                  )} (${formatPercentage(poolFee?.amounts.percentOfNav.toPercent() || 0)} NAV)`}
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
                          mt={4}
                          onClick={() => remove(index)}
                        >
                          <IconMinusCircle size="20px" />
                        </Box>
                      </Shelf>
                    )
                  })}
                </Stack>
                {chargableFees?.length ? (
                  <Box p={0}>
                    <Button
                      icon={<IconPlusCircle size="20px" />}
                      variant="tertiary"
                      onClick={() => push({ id: '', amount: '' })}
                      small
                    >
                      Add fees
                    </Button>
                  </Box>
                ) : null}
              </Stack>
            </>
          )
        }}
      </FieldArray>
    </Stack>
  )
}

export function useChargePoolFees(poolId: string, loanId: string) {
  const pool = usePool(poolId)
  const poolFees = usePoolFees(poolId)
  const cent = useCentrifuge()
  const [account] = useSuitableAccounts({ poolId: poolId })
  const borrower = useBorrower(poolId, loanId)
  const api = useCentrifugeApi()
  return {
    render: () => <ChargeFeesFields pool={pool as Pool} borrower={borrower} />,
    isValid: ({ values }: { values: Pick<FinanceValues | RepayValues, 'fees'> }) => {
      return values.fees.every((fee) => !!fee.id && !!fee && !!fee.amount)
    },
    getBatch: ({ values }: { values: Pick<FinanceValues | RepayValues, 'fees'> }) => {
      if (!values.fees.length) return of([])
      const fees = values.fees.flatMap((fee) => {
        if (!fee.amount) throw new Error('Charge amount not provided')
        if (!borrower) throw new Error('No borrower')
        if (!account) throw new Error('No account')
        const feeAmount = CurrencyBalance.fromFloat(fee.amount, pool.currency.decimals)
        const pendingFee = poolFees?.find((f) => f.id.toString() === fee.id)?.amounts.pending
        const feeTx = cent.pools.chargePoolFee([fee.id, feeAmount, pendingFee], { batch: true })
        // can't decode value [Object object] of type object
        return [
          of(
            wrapProxyCallsForAccount(
              api,
              api.tx.remarks.remark([{ Loan: [poolId, loanId] }], feeTx),
              borrower,
              'Transfer'
            )
          ),
        ]
      })
      return combineLatest(fees)
    },
  }
}
