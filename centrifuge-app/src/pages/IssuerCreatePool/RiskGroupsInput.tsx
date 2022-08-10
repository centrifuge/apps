import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Grid, IconMinusCircle, NumberInput, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import React from 'react'
import { createEmptyRiskGroup } from '.'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { PageSection } from '../../components/PageSection'
import { Tooltips } from '../../components/Tooltips'
import { validate } from './validate'

const MAX_GROUPS = 100

export const RiskGroupsInput: React.FC = () => {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  return (
    <FieldArray name="riskGroups">
      {(fldArr) => (
        <PageSection
          title="Risk group"
          subtitle="At least one risk group is required"
          headerRight={
            <Button
              variant="secondary"
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
          <Grid gridTemplateColumns="40px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 40px" gap={2} rowGap={3}>
            {values.riskGroups.map((s, index) => (
              <React.Fragment key={index}>
                <Stack gap="4px" py={1} alignItems="center" justifyContent="center">
                  <Text variant="body1">{index + 1}</Text>
                </Stack>
                <FieldWithErrorMessage
                  as={TextInput}
                  label="Group name"
                  placeholder=""
                  maxLength={30}
                  name={`riskGroups.${index}.groupName`}
                  validate={validate.groupName}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label={<Tooltips type="advanceRate" variant="secondary" label="Advance rate*" />}
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.advanceRate`}
                  validate={validate.advanceRate}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label={<Tooltips type="financingFee" variant="secondary" label="Financing fee*" />}
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.fee`}
                  validate={validate.fee}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label={<Tooltips type="probabilityOfDefault" variant="secondary" label="Prob. of default*" />}
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.probabilityOfDefault`}
                  validate={validate.probabilityOfDefault}
                />
                <FieldWithErrorMessage
                  as={NumberInput}
                  label={<Tooltips type="lossGivenDefault" variant="secondary" label="Loss given def.*" />}
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.lossGivenDefault`}
                  validate={validate.lossGivenDefault}
                />
                <TextInput
                  label={<Tooltips type="riskAdjustment" variant="secondary" />}
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
                  label={<Tooltips type="discountRate" variant="secondary" label="Discount rate*" />}
                  placeholder="0.00"
                  rightElement="%"
                  name={`riskGroups.${index}.discountRate`}
                  validate={validate.discountRate}
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
