import { PoolMetadataInput } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Button, Card, Shelf, Stack, Text, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { validate } from './validate'

const createDetail = () => ({
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
            <Box>
              <Text as="h3">Issuer profile</Text>
              <Text as="span" variant="body2" color="textSecondary">
                Add additional information
              </Text>
            </Box>
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
                <FieldWithErrorMessage
                  name={`details.${index}.title`}
                  validate={validate.issuerDetailTitle}
                  as={TextInput}
                  label="Title (max 50 characters)*"
                  maxLength={50}
                />

                <FieldWithErrorMessage
                  name={`details.${index}.body`}
                  validate={validate.issuerDetailBody}
                  as={TextAreaInput}
                  label="Description (max 3000 characters)*"
                  maxLength={3000}
                />

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
