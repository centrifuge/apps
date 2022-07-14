import { Box, Button, Grid, IconMinusCircle, NumberInput, Stack, Text } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyWriteOffGroup, PoolFormValues } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { validate } from './validate'

const MAX_GROUPS = 100

export const WriteOffInput: React.FC = () => {
  const fmk = useFormikContext<PoolFormValues>()
  const { values } = fmk

  return (
    <FieldArray name="writeOffGroups">
      {(fldArr) => (
        <PageSection
          title="Write-off schedule"
          subtitle="At least one write-off activity is required"
          headerRight={
            <Button
              variant="secondary"
              onClick={() => {
                fldArr.push(createEmptyWriteOffGroup())
              }}
              small
              disabled={values.tranches.length >= MAX_GROUPS}
            >
              Add another
            </Button>
          }
        >
          <Grid gridTemplateColumns="64px 1fr 1fr 40px" gap={2} rowGap={3}>
            {values.writeOffGroups.map((s, index) => (
              <React.Fragment key={index}>
                <Stack gap="4px" py={1}>
                  <Text variant="label2">Activity</Text>
                  <Text variant="body1">{index + 1}</Text>
                </Stack>
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Days after expected repayment date"
                  placeholder="0"
                  rightElement="d"
                  name={`writeOffGroups.${index}.days`}
                  validate={validate.days}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label="Write-off"
                  placeholder="0.00"
                  rightElement="%"
                  name={`writeOffGroups.${index}.writeOff`}
                  validate={validate.writeOff}
                />
                <Box p={1}>
                  {index !== 0 && (
                    <Button variant="tertiary" icon={IconMinusCircle} onClick={() => fldArr.remove(index)} />
                  )}
                </Box>
              </React.Fragment>
            ))}
          </Grid>
        </PageSection>
      )}
    </FieldArray>
  )
}
