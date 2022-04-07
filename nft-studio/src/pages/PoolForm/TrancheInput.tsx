import { Box, Button, IconPlus, Stack, Text } from '@centrifuge/fabric'
import { Field, FieldArray, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyTranche, PoolFormValues, Tranche } from '.'
import { TextInput } from '../../components/form/formik/TextInput'
import { validate } from './validate'

export const TrancheInput: React.FC = () => {
  const fmk = useFormikContext<PoolFormValues>()
  const { values } = fmk

  const juniorTrancheIndex = 0 // the first tranche is the most junior in the UI

  return (
    <FieldArray name="tranches">
      {(fldArr) => (
        <Stack gap="4" gridColumn="6 / 9" marginTop="9">
          <Text variant="heading3">Tranches</Text>

          {values.tranches.map((s: Tranche, index: number) => (
            <React.Fragment key={index}>
              <Field
                as={TextInput}
                label="Token name"
                placeholder=""
                name={`tranches.${index}.tokenName`}
                validate={validate.tokenName}
              />
              <Field
                as={TextInput}
                label="Token symbol"
                placeholder=""
                name={`tranches.${index}.symbolName`}
                validate={validate.symbolName}
              />
              {index !== juniorTrancheIndex && (
                <>
                  <Field
                    as={TextInput}
                    label="Interest rate"
                    placeholder="0.00%"
                    name={`tranches.${index}.interestRate`}
                    validate={validate.interestRate}
                  />
                  <Field
                    as={TextInput}
                    label="Minimum risk buffer"
                    placeholder="0.00%"
                    name={`tranches.${index}.minRiskBuffer`}
                    validate={validate.minRiskBuffer}
                  />
                </>
              )}

              <Box borderBottomWidth="1px" borderBottomStyle="solid" borderBottomColor="borderPrimary" />
            </React.Fragment>
          ))}
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
