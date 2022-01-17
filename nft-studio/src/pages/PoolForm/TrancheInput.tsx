import { Box, Button, IconPlus, Stack, Text } from '@centrifuge/fabric'
import { FieldArray, useField, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyTranche, PoolFormValues, Tranche } from '.'
import { TextInput } from '../../components/form/formik/TextInput'

export const TrancheInput: React.FC = () => {
  const fmk = useFormikContext<PoolFormValues>()
  const { values } = fmk
  const [field, meta, helpers] = useField('tranches')

  console.log({ field, meta, helpers })

  const juniorTrancheIndex = 0 // the first tranche is the most junior in the UI

  return (
    <FieldArray name="tranches">
      {(fldArr) => (
        <Stack gap="4" gridColumn="6 / 9" marginTop="9">
          <Text variant="heading3">Tranches</Text>

          {values.tranches.map((s: Tranche, index: number) => (
            <React.Fragment key={index}>
              <TextInput label="Token name" placeholder="" name={`tranches.${index}.tokenName`} />
              <TextInput label="Token symbol" placeholder="" name={`tranches.${index}.symbolName`} />
              {index !== juniorTrancheIndex && (
                <>
                  <TextInput label="Interest rate" placeholder="0.00%" name={`tranches.${index}.interestRate`} />
                  <TextInput label="Minimum risk buffer" placeholder="0.00%" name={`tranches.${index}.minRiskBuffer`} />
                </>
              )}

              <Box borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="borderPrimary" />
            </React.Fragment>
          ))}
          {/* <TextInput label="Token name" placeholder="SEN" />
        <TextInput label="Interest rate" placeholder="0.00%" />
        <TextInput label="Minimum risk buffer" placeholder="0.00%" />

        <Box borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="borderPrimary" /> */}
          <Box>
            <Button
              variant="text"
              icon={<IconPlus />}
              onClick={() => {
                fldArr.push(createEmptyTranche())
              }}
            >
              Add another tranche
            </Button>
          </Box>
        </Stack>
      )}
    </FieldArray>
  )
}
