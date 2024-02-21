import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Grid, IconMinusCircle, NumberInput, Select, Text, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { useAddress } from '../../utils/useAddress'

const MAX_FEES = 5

const FEE_TYPES = [
  { label: 'Direct charge', value: 'ChargedUpTo' },
  { label: 'Fixed', value: 'Fixed' },
]

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

export const PoolFeeSection: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk
  const address = useAddress()

  React.useEffect(() => {
    fmk.setFieldValue(`poolFees.0.name`, DEFAULT_FEE[values.poolType][values.assetClass].name)
    fmk.setFieldValue(`poolFees.0.feeType`, 'Fixed')
    fmk.setFieldValue(`poolFees.0.walletAddress`, import.meta.env.REACT_APP_TREASURY)
    fmk.setFieldValue(`poolFees.0.percentOfNav`, DEFAULT_FEE[values.poolType][values.assetClass].fee)
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
                fldArr.push({ name: '', feeType: 'ChargedUpTo', percentOfNav: '', walletAddress: '' })
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

export const PoolFeeInput: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  return (
    <FieldArray name="poolFees">
      {(fldArr) => (
        <Grid gridTemplateColumns={'1fr 1fr 1fr 1fr 40px'} gap={2} rowGap={3}>
          {values.poolFees.map((s, index) => (
            <React.Fragment key={index}>
              <FieldWithErrorMessage
                as={TextInput}
                label="Name"
                maxLength={30}
                name={`poolFees.${index}.name`}
                disabled={index < 1}
              />

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
                label="Max fees in % of NAV"
                min={0}
                max={100}
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

              <Box pt={1}>
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
