import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Grid, IconMinusCircle, NumberInput, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { feeCategories } from '../../config'
import { useAddress } from '../../utils/useAddress'

const MAX_FEES = 5

const FEE_TYPES = [
  { label: 'Direct charge', value: 'chargedUpTo' },
  { label: 'Fixed %', value: 'fixed' },
]

const FEE_POSISTIONS = [{ label: 'Top of waterfall', value: 'Top of waterfall' }]

const DEFAULT_FEE = {
  open: {
    'Public credit': {
      fee: 0.075,
      name: 'Protocol fee (Public Securities & Equities)',
    },
    'Private credit': {
      fee: 0.4,
      name: 'Protocol fee (Private Credit & Securities)',
    },
  },
  closed: {
    'Public credit': {
      fee: 0.02,
      name: 'Protocol fee (Public Securities & Equities)',
    },
    'Private credit': {
      fee: 0.15,
      name: 'Protocol fee (Private Credit & Securities)',
    },
  },
}

export function PoolFeeSection() {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk
  const address = useAddress()

  React.useEffect(() => {
    fmk.setFieldValue(
      `poolFees.0`,
      {
        name: DEFAULT_FEE[values.poolType][values.assetClass].name,
        feeType: 'fixed',
        walletAddress: import.meta.env.REACT_APP_TREASURY,
        percentOfNav: DEFAULT_FEE[values.poolType][values.assetClass].fee,
        feePosition: 'Top of waterfall',
        category: 'Protocol',
      },
      false
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.assetClass, values.poolType, address])

  return (
    <FieldArray name="poolFees">
      {(fldArr) => (
        <PageSection
          title="Pool fees"
          headerRight={
            <Button
              variant="secondary"
              onClick={() => {
                fldArr.push({
                  name: '',
                  feeType: 'chargedUpTo',
                  percentOfNav: '',
                  walletAddress: '',
                  feePosition: 'Top of waterfall',
                  category: feeCategories[0],
                })
              }}
              small
              disabled={values.tranches.length >= MAX_FEES}
            >
              Add another
            </Button>
          }
        >
          <PoolFeeInput />
        </PageSection>
      )}
    </FieldArray>
  )
}

export function PoolFeeInput() {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  return (
    <FieldArray name="poolFees">
      {(fldArr) => (
        <Grid gridTemplateColumns={'1fr 1fr 1fr 1fr 1fr 1fr 40px'} gap={2} rowGap={3}>
          {values.poolFees.map((s, index) => (
            <React.Fragment key={index}>
              <FieldWithErrorMessage
                as={TextInput}
                label="Name"
                maxLength={30}
                name={`poolFees.${index}.name`}
                disabled={index < 1}
              />
              <Field name={`poolFees.${index}.category`}>
                {({ field, form, meta }: FieldProps) =>
                  field.value === 'Protocol' ? (
                    <FieldWithErrorMessage
                      as={TextInput}
                      label="Category"
                      name={`poolFees.${index}.category`}
                      disabled
                    />
                  ) : (
                    <Select
                      name="category"
                      label="Category"
                      onChange={(event) => form.setFieldValue(`poolFees.${index}.category`, event.target.value)}
                      onBlur={field.onBlur}
                      disabled={index < 1}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={feeCategories.map((cat) => ({ label: cat, value: cat }))}
                    />
                  )
                }
              </Field>
              <Field name={`poolFees.${index}.feePosition`}>
                {({ field, meta }: FieldProps) => {
                  return (
                    <Select
                      label={
                        <Tooltips
                          type="feePosition"
                          label={
                            <Text variant="label2" color="textDisabled">
                              Fee position
                            </Text>
                          }
                        />
                      }
                      name={`poolFees.${index}.feePosition`}
                      onChange={(event) => {
                        fmk.setFieldValue(`poolFees.${index}.feePosition`, event.target.value)
                      }}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={FEE_POSISTIONS}
                      disabled={index < 1}
                    />
                  )
                }}
              </Field>

              <Field name={`poolFees.${index}.feeType`}>
                {({ field, meta }: FieldProps) => {
                  return (
                    <Select
                      label={
                        index === 0 ? (
                          <Tooltips
                            type="feeType"
                            label={
                              <Text variant="label2" color="textDisabled">
                                Fee type
                              </Text>
                            }
                          />
                        ) : (
                          'Fee type'
                        )
                      }
                      name={`poolFees.${index}.feeType`}
                      onChange={(event) => {
                        fmk.setFieldValue(`poolFees.${index}.feeType`, event.target.value)
                      }}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={FEE_TYPES}
                      disabled={index < 1}
                    />
                  )
                }}
              </Field>

              <FieldWithErrorMessage
                as={NumberInput}
                label={fmk.values.poolFees[index].feeType === 'fixed' ? 'Fees in % of NAV' : 'Max fees in % of NAV'}
                symbol="%"
                name={`poolFees.${index}.percentOfNav`}
                disabled={index < 1}
              />

              <FieldWithErrorMessage
                as={TextInput}
                label="Wallet address"
                name={`poolFees.${index}.walletAddress`}
                disabled={index < 1}
              />

              <Box pt={1} alignSelf="flex-end">
                <Button
                  disabled={index < 1}
                  variant="tertiary"
                  icon={IconMinusCircle}
                  onClick={() => fldArr.remove(index)}
                />
              </Box>
            </React.Fragment>
          ))}
        </Grid>
      )}
    </FieldArray>
  )
}
