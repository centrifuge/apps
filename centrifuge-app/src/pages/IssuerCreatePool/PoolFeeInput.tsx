import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Grid, IconMinusCircle, NumberInput, Select, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { useAddress } from '../../utils/useAddress'

const MAX_FEES = 5

const FEE_TYPES = [
  { label: 'Direct charge', value: 'ChargedUpTo' },
  { label: 'Fixed', value: 'Fixed' },
]

export const PoolFeeSection: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk
  const address = useAddress()

  React.useEffect(() => {
    const isPrivateCredit = values.assetClass === 'privateCredit'

    const defaultFees = [
      {
        name: 'Private Credit & Securities fees',
        feeType: 'Fixed',
        walletAddress: import.meta.env.REACT_APP_TREASURY,
        percentOfNav: isPrivateCredit ? 0.15 : 0.4,
      },
      {
        name: 'Public Securities & Equities fees',
        feeType: 'Fixed',
        walletAddress: import.meta.env.REACT_APP_TREASURY,
        percentOfNav: isPrivateCredit ? 0.02 : 0.075,
      },
    ]

    defaultFees.forEach((fee, index) => {
      fmk.setFieldValue(`poolFees.${index}.name`, fee.name)
      fmk.setFieldValue(`poolFees.${index}.feeType`, fee.feeType)
      fmk.setFieldValue(`poolFees.${index}.walletAddress`, fee.walletAddress)
      fmk.setFieldValue(`poolFees.${index}.percentOfNav`, fee.percentOfNav)
    })
  }, [values.assetClass, address])

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
        <Grid gridTemplateColumns={'1fr 1fr 1fr 1fr 40px'} gap={2} rowGap={3} alignItems="center">
          {values.poolFees.map((s, index) => (
            <React.Fragment key={index}>
              <FieldWithErrorMessage
                as={TextInput}
                label="Name"
                maxLength={30}
                name={`poolFees.${index}.name`}
                disabled={index < 2}
              />

              <Field name={`poolFees.${index}.feeType`}>
                {({ field, meta }: FieldProps) => {
                  return (
                    <Select
                      label="Fee type"
                      name={`poolFees.${index}.feeType`}
                      onChange={(event) => {
                        fmk.setFieldValue(`poolFees.${index}.feeType`, event.target.value)
                      }}
                      onBlur={field.onBlur}
                      errorMessage={meta.touched && meta.error ? meta.error : undefined}
                      value={field.value}
                      options={FEE_TYPES}
                      disabled={index < 2}
                    />
                  )
                }}
              </Field>

              <FieldWithErrorMessage
                as={NumberInput}
                label="Fees in % of NAV"
                min={0}
                max={100}
                symbol="%"
                name={`poolFees.${index}.percentOfNav`}
                disabled={index < 2}
              />

              <FieldWithErrorMessage
                as={TextInput}
                label="Wallet address"
                name={`poolFees.${index}.walletAddress`}
                disabled={index < 2}
              />

              <Box pt={1}>
                <Button
                  disabled={index < 2}
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
