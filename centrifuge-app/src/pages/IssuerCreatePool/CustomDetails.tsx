import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Card, Shelf, Stack, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, useFormikContext } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { validate } from './validate'

export const createDetail = () => ({
  title: '',
  body: '',
})

export type IssuerDetail = {
  title?: string
  body?: string
}

export function CustomDetails() {
  const fmk = useFormikContext<PoolMetadataInput>()
  const { values } = fmk

  return (
    <FieldArray name="details">
      {(fldArr) => (
        <Box>
          <Shelf justifyContent="space-between">
            <Text>Custom content</Text>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                fldArr.push(createDetail())
              }}
              small
              disabled={(values?.details && values.details.length >= 3) ?? false}
            >
              {values.details?.length ? 'Add another' : 'Add'}
            </Button>
          </Shelf>

          {!!values?.details?.length &&
            values.details.map((_, index) => (
              <Stack key={index} as={Card} p={1} gap={2} mt={2} alignItems="end">
                <Field name={`details.${index}.title`}>
                  {({ field, form, meta }: FieldProps) => (
                    <FieldWithErrorMessage
                      {...field}
                      validate={validate.issuerDetailTitle}
                      as={TextInput}
                      label="Title"
                      maxLength={100}
                    />
                  )}
                </Field>

                <Field name={`details.${index}.body`}>
                  {({ field, form, meta }: FieldProps) => (
                    <FieldWithErrorMessage
                      {...field}
                      validate={validate.issuerDetailBody}
                      as={TextAreaInput}
                      label="Description (max 1000)"
                      maxLength={1000}
                    />
                  )}
                </Field>

                <Button
                  type="button"
                  variant="secondary"
                  small
                  onClick={() => {
                    fldArr.remove(index)
                  }}
                >
                  Remove
                </Button>
              </Stack>
            ))}
        </Box>
      )}
    </FieldArray>
  )
}
