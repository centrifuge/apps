import { AddFee, PoolMetadata, Rate, evmToSubstrateAddress } from '@centrifuge/centrifuge-js'
import { useCentEvmChainId, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  AddressInput,
  Box,
  Button,
  Drawer,
  Flex,
  Grid,
  IconMinusCircle,
  IconPlusCircle,
  NumberInput,
  Select,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useParams } from 'react-router'
import { feeCategories } from '../../config'
import { Dec } from '../../utils/Decimal'
import { isEvmAddress } from '../../utils/address'
import { formatPercentage } from '../../utils/formatting'
import { usePoolAdmin, useSuitableAccounts } from '../../utils/usePermissions'
import { usePool, usePoolFees, usePoolMetadata } from '../../utils/usePools'
import { combine, max, positiveNumber, required } from '../../utils/validation'
import { ButtonGroup } from '../ButtonGroup'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

type FormValues = {
  poolFees: {
    feeName: string
    percentOfNav: number | ''
    category: string
    receivingAddress: string
    feeId: number | undefined
    type: 'fixed' | 'chargedUpTo'
  }[]
}

export const EditFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId)
  const poolFees = usePoolFees(poolId)
  const { data: poolMetadata, isLoading } = usePoolMetadata(pool)
  const poolAdmin = usePoolAdmin(poolId)
  const account = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })[0]
  const chainId = useCentEvmChainId()

  const initialFormData = React.useMemo(() => {
    return poolFees
      ?.filter((poolFees) => !('root' in poolFees.editor))
      ?.map((feeChainData) => {
        const feeMetadata = poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id)
        return {
          percentOfNav: feeChainData?.amounts.percentOfNav.toPercent().toNumber() ?? undefined,
          feeName: feeMetadata?.name || '',
          category: feeMetadata?.category || '',
          receivingAddress: feeChainData?.destination || '',
          feeId: feeChainData.id || 0,
          type: feeChainData.type,
        }
      })
  }, [poolFees, poolMetadata?.pool?.poolFees])

  const {
    execute: updateFeesTx,
    isLoading: updateFeeTxLoading,
    reset,
  } = useCentrifugeTransaction('Update fees', (cent) => cent.pools.updateFees)

  const form = useFormik<FormValues>({
    initialValues: {
      poolFees: initialFormData || [],
    },
    validateOnChange: false,
    onSubmit: (values) => {
      if (!poolMetadata) throw new Error('poolMetadata not found')
      // find fees that have been updated so they can be removed (and re-added)
      const remove: number[] =
        initialFormData
          ?.filter((initialFee) => {
            const fee = values.poolFees?.find((f) => f.feeId === initialFee.feeId)
            const newPercent = Dec(fee?.percentOfNav || 0)
              .toFixed(2)
              ?.toString()
            return (
              initialFee.feeName !== fee?.feeName ||
              parseFloat(initialFee?.percentOfNav?.toString() || '0') !== parseFloat(newPercent) ||
              initialFee.receivingAddress !== fee?.receivingAddress ||
              initialFee.type !== fee?.type
            )
          })
          .map((initialFee) => initialFee.feeId) || []
      const add: AddFee[] = values.poolFees
        .filter((fee) => {
          // skip fees if they are unchanged from initial data
          const initialFee = initialFormData?.find((f) => f.feeId === fee.feeId)
          const newPercent = Dec(fee.percentOfNav || 0)
            .toFixed(2)
            ?.toString()

          return !(
            initialFee?.feeName === fee.feeName &&
            parseFloat(initialFee?.percentOfNav?.toString() || '0') === parseFloat(newPercent) &&
            initialFee?.receivingAddress === fee.receivingAddress &&
            initialFee?.type === fee.type
          )
        })
        .map((fee) => {
          const destination = isEvmAddress(fee.receivingAddress)
            ? evmToSubstrateAddress(fee.receivingAddress, chainId)
            : fee.receivingAddress
          return {
            poolId,
            fee: {
              name: fee.feeName,
              destination,
              amount: Rate.fromPercent(Dec(fee?.percentOfNav || 0)),
              feeId: fee.feeId,
              feeType: fee.type,
              category: fee.category,
              limit: 'ShareOfPortfolioValuation',
              account: account.actingAddress,
              feePosition: 'Top of waterfall',
            },
          }
        })
      updateFeesTx([add, remove, poolId, poolMetadata as PoolMetadata], { account })
    },
  })

  React.useEffect(() => {
    if (!isLoading && isOpen) {
      form.setValues({ poolFees: initialFormData || [] })
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, initialFormData, isOpen])

  return (
    <Drawer isOpen={isOpen} onClose={onClose} px={0}>
      <Stack gap={0}>
        <Stack px={3} pb={3}>
          <Text variant="heading2">Fee structure</Text>
        </Stack>
        <Shelf px={3} gap={3} alignItems="flex-start" justifyContent="flex-start">
          <Stack width="100%" borderTop={poolFees ? '0.5px solid' : undefined} borderColor="borderPrimary">
            {poolFees
              ?.filter((poolFees) => 'root' in poolFees.editor)
              .map((feeChainData, index) => {
                const feeMetadata = poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id)
                return (
                  <Grid
                    key={`poolFees.${index}.${feeMetadata?.name}`}
                    gridTemplateColumns="2fr 1fr"
                    gap={2}
                    py="11px"
                    borderBottom="0.5px solid"
                    borderTop={!poolMetadata?.pool?.poolFees?.at(-1) ? '0.5px solid' : undefined}
                    borderColor="borderPrimary"
                  >
                    <Text variant="body2" color="textSecondary">
                      {feeMetadata?.name}
                    </Text>
                    <Text variant="body2" color="textSecondary">
                      {formatPercentage(feeChainData?.amounts.percentOfNav.toPercent() || 0, true, {}, 3)} of NAV
                    </Text>
                  </Grid>
                )
              })}
          </Stack>
        </Shelf>
        <Stack width="100%" backgroundColor="backgroundSecondary">
          <Stack p={3}>
            <FormikProvider value={form}>
              <Form>
                <Stack gap={3}>
                  <FieldArray name="poolFees">
                    {({ push, remove }) => (
                      <Stack gap={1} justifyContent="flex-start">
                        <Stack gap={3} justifyContent="flex-start">
                          <Text variant="body2" minWidth="250px">
                            Other fees
                          </Text>
                          {form.values.poolFees.map((values, index) => {
                            return (
                              <Shelf
                                key={`poolFees.${index}`}
                                gap={2}
                                alignItems="flex-start"
                                borderBottomColor="borderSecondary"
                                borderBottomWidth={1}
                                borderBottomStyle="solid"
                              >
                                <Stack gap={2} pb={3}>
                                  <Shelf gap={2} alignItems="flex-start">
                                    <Stack flex="0 1 50%">
                                      <Field name={`poolFees.${index}.feeName`} validate={required()}>
                                        {({ field, meta }: FieldProps) => {
                                          return (
                                            <TextInput
                                              {...field}
                                              label="Name"
                                              disabled={!poolAdmin || updateFeeTxLoading}
                                              errorMessage={(meta.touched && meta.error) || ''}
                                            />
                                          )
                                        }}
                                      </Field>
                                    </Stack>
                                    <Stack flex="0 1 50%">
                                      <Field name={`poolFees.${index}.category`}>
                                        {({ field, form, meta }: FieldProps) => (
                                          <Select
                                            name="category"
                                            label="Category"
                                            onChange={(event) =>
                                              form.setFieldValue(`poolFees.${index}.category`, event.target.value)
                                            }
                                            onBlur={field.onBlur}
                                            disabled={!poolAdmin || updateFeeTxLoading}
                                            errorMessage={meta.touched && meta.error ? meta.error : undefined}
                                            value={field.value}
                                            options={feeCategories.map((cat) => ({ label: cat, value: cat }))}
                                          />
                                        )}
                                      </Field>
                                    </Stack>
                                  </Shelf>
                                  <Shelf gap={2} alignItems="flex-start">
                                    <Stack flex="1 1 50%">
                                      <Field name={`poolFees.${index}.type`}>
                                        {({ field, form, meta }: FieldProps) => (
                                          <Select
                                            name="type"
                                            label="Fee type"
                                            onChange={(event) =>
                                              form.setFieldValue(`poolFees.${index}.type`, event.target.value)
                                            }
                                            onBlur={field.onBlur}
                                            disabled={!poolAdmin || updateFeeTxLoading}
                                            errorMessage={meta.touched && meta.error ? meta.error : undefined}
                                            value={field.value}
                                            options={[
                                              { label: 'Fixed', value: 'fixed' },
                                              { label: 'Direct charge', value: 'chargedUpTo' },
                                            ]}
                                          />
                                        )}
                                      </Field>
                                    </Stack>
                                    <Stack flex="0 1 50%">
                                      <Field
                                        name={`poolFees.${index}.percentOfNav`}
                                        validate={combine(
                                          required(),
                                          positiveNumber(),
                                          max(100, 'Must be less than 100%')
                                        )}
                                      >
                                        {({ field, meta }: FieldProps) => {
                                          return (
                                            <NumberInput
                                              {...field}
                                              label="Max fees in % of NAV"
                                              symbol="%"
                                              disabled={!poolAdmin || updateFeeTxLoading}
                                              errorMessage={(meta.touched && meta.error) || ''}
                                            />
                                          )
                                        }}
                                      </Field>
                                    </Stack>
                                  </Shelf>
                                  <Field name={`poolFees.${index}.receivingAddress`} validate={required()}>
                                    {({ field, meta }: FieldProps) => {
                                      return (
                                        <AddressInput
                                          {...field}
                                          disabled={!poolAdmin || updateFeeTxLoading}
                                          label="Receiving address"
                                          errorMessage={(meta.touched && meta.error) || ''}
                                        />
                                      )
                                    }}
                                  </Field>
                                </Stack>
                                <Flex flex="0 0 20px" pt="26px">
                                  <Button
                                    onClick={() => {
                                      remove(index)
                                    }}
                                    variant="tertiary"
                                    disabled={!poolAdmin || updateFeeTxLoading}
                                    small
                                  >
                                    <IconMinusCircle size="20px" />
                                  </Button>
                                </Flex>
                              </Shelf>
                            )
                          })}
                        </Stack>
                        <Box>
                          <Button
                            icon={<IconPlusCircle />}
                            variant="tertiary"
                            disabled={!poolAdmin || updateFeeTxLoading}
                            onClick={() =>
                              push({
                                feeName: '',
                                percentOfNav: '',
                                receivingAddress: '',
                                feeId: undefined,
                                type: 'chargedUpTo',
                              })
                            }
                          >
                            Add new fee
                          </Button>
                        </Box>
                      </Stack>
                    )}
                  </FieldArray>
                  <ButtonGroup>
                    <Button disabled={!poolAdmin || updateFeeTxLoading} loading={updateFeeTxLoading} type="submit">
                      Save
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Form>
            </FormikProvider>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  )
}
