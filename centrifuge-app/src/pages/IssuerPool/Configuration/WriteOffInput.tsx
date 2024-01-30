import { Box, Button, Grid, IconMinusCircle, NumberInput_DEPRECATED } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../../components/FieldWithErrorMessage'
import { validate } from '../../IssuerCreatePool/validate'
import { WriteOffGroupValues } from './WriteOffGroups'

export const WriteOffInput: React.FC = () => {
  const fmk = useFormikContext<WriteOffGroupValues>()
  const { values } = fmk

  return (
    <FieldArray name="writeOffGroups">
      {(fldArr) => (
        <Grid gridTemplateColumns="1fr 1fr 1fr 40px" gap={2} rowGap={2}>
          {values.writeOffGroups.map((s, index) => (
            <React.Fragment key={index}>
              <FieldWithErrorMessage
                as={NumberInput_DEPRECATED}
                label="Days after expected repayment date*"
                placeholder="0"
                symbol="d"
                name={`writeOffGroups.${index}.days`}
                validate={validate.days}
              />
              <FieldWithErrorMessage
                as={NumberInput_DEPRECATED}
                label="Write-off*"
                placeholder="0.00"
                symbol="%"
                name={`writeOffGroups.${index}.writeOff`}
                validate={validate.writeOff}
              />
              <FieldWithErrorMessage
                as={NumberInput_DEPRECATED}
                label="Penalty fee*"
                placeholder="0.00"
                symbol="%"
                name={`writeOffGroups.${index}.penaltyInterest`}
                validate={validate.penaltyInterest}
              />
              <Box p={1}>
                {index !== 0 && (
                  <Button variant="tertiary" icon={IconMinusCircle} onClick={() => fldArr.remove(index)} />
                )}
              </Box>
            </React.Fragment>
          ))}
        </Grid>
      )}
    </FieldArray>
  )
}
