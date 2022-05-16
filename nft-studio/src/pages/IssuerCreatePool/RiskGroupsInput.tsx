import { Box, Button, Grid, IconMinusCircle, NumberInput, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyRiskGroup, PoolFormValues } from '.'
import { FieldWithErrorMessage } from '../../components/form/formik/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { validate } from './validate'

const MAX_GROUPS = 100

export const RiskGroupsInput: React.FC = () => {
  const fmk = useFormikContext<PoolFormValues>()
  const { values } = fmk

  return (
    <FieldArray name="riskGroups">
      {(fldArr) => (
        <PageSection
          title="Risk group"
          subtitle="At least one risk group is required"
          headerRight={
            <Button
              variant="outlined"
              onClick={() => {
                fldArr.push(createEmptyRiskGroup())
              }}
              small
              disabled={values.riskGroups.length >= MAX_GROUPS}
            >
              Add another
            </Button>
          }
        >
          <Grid gridTemplateColumns="64px 2fr 1fr 1fr 1fr 1fr 1fr 1fr 40px" gap={2} rowGap={3}>
            {values.riskGroups.map((s, index) => (
              <React.Fragment key={index}>
                <Stack gap="4px" py={1}>
                  <Text variant="label2">Group</Text>
                  <Text variant="body1">{index + 1}</Text>
                </Stack>
                <FieldWithErrorMessage
                  as={TextInput}
                  label="Name (optional)"
                  placeholder=""
                  maxLength={30}
                  name={`riskGroups.${index}.groupName`}
                  validate={validate.groupName}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Advance rate"
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.advanceRate`}
                  validate={validate.advanceRate}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Financing fee"
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.fee`}
                  validate={validate.fee}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Prob. of default"
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.probabilityOfDefault`}
                  validate={validate.probabilityOfDefault}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Loss given def."
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.lossGivenDefault`}
                  validate={validate.lossGivenDefault}
                />
                <TextInput
                  label="Risk adjustment"
                  disabled
                  value={Math.max(
                    Math.min(
                      (Number(values.riskGroups[index].probabilityOfDefault) / 100) *
                        (Number(values.riskGroups[index].lossGivenDefault) / 100) *
                        100,
                      100
                    ),
                    0
                  ).toFixed(2)}
                  rightElement="%"
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Discount rate"
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.discountRate`}
                  validate={validate.discountRate}
                />
                <Box p={1}>
                  {index !== 0 && <Button variant="text" icon={IconMinusCircle} onClick={() => fldArr.remove(index)} />}
                </Box>
              </React.Fragment>
            ))}
          </Grid>
        </PageSection>
      )}
    </FieldArray>
  )
}
