import { AddFee, PoolMetadata, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Drawer,
  Grid,
  IconButton,
  IconCopy,
  IconMinusCircle,
  IconPlusCircle,
  NumberInput,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React from 'react'
import { useParams } from 'react-router'
import { isEvmAddress, isSubstrateAddress } from '../../utils/address'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatPercentage } from '../../utils/formatting'
import { usePoolAdmin, useSuitableAccounts } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { ButtonGroup } from '../ButtonGroup'

type ChargeFeesProps = {
  onClose: () => void
  isOpen: boolean
}

export const EditFeesDrawer = ({ onClose, isOpen }: ChargeFeesProps) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: poolMetadata, isLoading } = usePoolMetadata(pool)
  const poolAdmin = usePoolAdmin(poolId)
  const account = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] })[0]

  const initialFormData = React.useMemo(() => {
    return pool.poolFees
      ?.filter((poolFees) => poolFees.type !== 'fixed')
      .map((feeChainData) => {
        const feeMetadata = poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id)
        return {
          percentOfNav: parseFloat(feeChainData?.amounts.percentOfNav.toDecimal().toFixed(2)) ?? undefined,
          feeName: feeMetadata?.name || '',
          receivingAddress: feeChainData?.destination || '',
          feeId: feeChainData?.id || 0,
        }
      })
  }, [pool.poolFees, poolMetadata?.pool?.poolFees])

  React.useEffect(() => {
    if (!isLoading) {
      form.setValues({ poolFees: initialFormData || [] })
    }
  }, [isLoading, initialFormData])

  const { execute: updateFeesTx, isLoading: updateFeeTxLoading } = useCentrifugeTransaction(
    'Update fees',
    (cent) => cent.pools.updateFees
  )

  const form = useFormik<{
    poolFees: { feeName: string; percentOfNav?: number; receivingAddress: string; feeId: number }[]
  }>({
    initialValues: {
      poolFees: initialFormData || [],
    },
    validateOnChange: false,
    validate(values) {
      let errors: { poolFees?: { feeName?: string; percentOfNav?: string; receivingAddress?: string }[] } = {}
      values.poolFees.forEach((fee, index) => {
        if (!fee.feeName) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].feeName = 'Required'
        }
        if (!fee.percentOfNav) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].percentOfNav = 'Required'
        }
        if (fee.percentOfNav && fee.percentOfNav <= 0) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].percentOfNav = 'Must be greater than 0%'
        }
        if (fee.percentOfNav && fee.percentOfNav >= 100) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].percentOfNav = 'Must be less than 100%'
        }
        if (!fee.receivingAddress) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].receivingAddress = 'Required'
        }
        if (fee.receivingAddress && !isEvmAddress(fee.receivingAddress) && !isSubstrateAddress(fee.receivingAddress)) {
          errors.poolFees = errors.poolFees || []
          errors.poolFees[index] = errors.poolFees[index] || {}
          errors.poolFees[index].receivingAddress = 'Invalid address'
        }
      })
      return errors
    },
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
              initialFee.receivingAddress !== fee?.receivingAddress
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
            initialFee?.receivingAddress === fee.receivingAddress
          )
        })
        .map((fee) => {
          return {
            poolId,
            fee: {
              name: fee.feeName,
              destination: fee.receivingAddress,
              amount: Rate.fromFloat(Dec(fee?.percentOfNav || 0)),
              feeId: fee.feeId,
              type: 'ChargedUpTo',
              limit: 'ShareOfPortfolioValuation',
              account: account.actingAddress,
            },
          }
        })

      updateFeesTx([add, remove, poolId, poolMetadata as PoolMetadata], { account })
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose} px={0}>
      <Stack gap={0}>
        <Stack px={3} pb={3}>
          <Text variant="heading2">Fee structure</Text>
        </Stack>
        <Shelf px={3} gap={3} alignItems="flex-start" justifyContent="flex-start">
          <Stack width="100%" borderTop={pool.poolFees ? '0.5px solid' : undefined} borderColor="borderPrimary">
            {pool.poolFees
              ?.filter((poolFees) => poolFees.type === 'fixed')
              .map((feeChainData, index) => {
                const feeMetadata = poolMetadata?.pool?.poolFees?.find((f) => f.id === feeChainData.id)
                return (
                  <Grid
                    key={`poolFees.${index}.${feeMetadata?.name}`}
                    gridTemplateColumns="repeat(2, 1fr)"
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
                      {formatPercentage(feeChainData?.amounts.percentOfNav.toDecimal() || 0)} of NAV
                    </Text>
                  </Grid>
                )
              })}
          </Stack>
        </Shelf>
        <Stack width="100%" backgroundColor="backgroundTertiary">
          <Stack p={3}>
            <FormikProvider value={form}>
              <Form>
                <Stack gap={3}>
                  <FieldArray name="poolFees">
                    {({ push, remove }) => (
                      <Stack gap={1} justifyContent="flex-start">
                        <Stack gap={3} justifyContent="flex-start">
                          <Text variant="body2" minWidth="250px">
                            Direct charge
                          </Text>
                          {form.values.poolFees.map((values, index) => {
                            return (
                              <Shelf key={`poolFees.${index}`} alignItems="center" gap={4}>
                                <Stack gap={2} borderBottom="0.5px solid borderPrimary" pb={3} maxWidth="350px">
                                  <Shelf gap={2}>
                                    <Field name={`poolFees.${index}.feeName`}>
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
                                    <Field name={`poolFees.${index}.percentOfNav`}>
                                      {({ field, meta }: FieldProps) => {
                                        return (
                                          <NumberInput
                                            {...field}
                                            label="Current percentage"
                                            symbol="%"
                                            disabled={!poolAdmin || updateFeeTxLoading}
                                            errorMessage={(meta.touched && meta.error) || ''}
                                          />
                                        )
                                      }}
                                    </Field>
                                  </Shelf>
                                  <Field name={`poolFees.${index}.receivingAddress`}>
                                    {({ field, meta }: FieldProps) => {
                                      return (
                                        <TextInput
                                          {...field}
                                          disabled={!poolAdmin || updateFeeTxLoading}
                                          label="Receiving address"
                                          symbol={
                                            <IconButton
                                              onClick={() => copyToClipboard(values.receivingAddress)}
                                              title="Copy address to clipboard"
                                            >
                                              <IconCopy />
                                            </IconButton>
                                          }
                                          errorMessage={(meta.touched && meta.error) || ''}
                                        />
                                      )
                                    }}
                                  </Field>
                                </Stack>
                                <Button
                                  onClick={() => {
                                    remove(index)
                                  }}
                                  variant="tertiary"
                                  disabled={!poolAdmin || updateFeeTxLoading}
                                >
                                  <IconMinusCircle size="20px" />
                                </Button>
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
                              push({ feeName: '', percentOfNav: undefined, receivingAddress: '', feeId: undefined })
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
