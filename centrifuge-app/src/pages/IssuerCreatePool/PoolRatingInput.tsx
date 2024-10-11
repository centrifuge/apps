import { PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { Box, Button, Grid, IconMinusCircle, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FieldArray, useFormikContext } from 'formik'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'

export function PoolRatingInput() {
  const form = useFormikContext<PoolMetadataInput>()
  console.log('🚀 ~ form:', form.values.poolRatings)
  return (
    <FieldArray name="poolRatings">
      {({ push, remove }) => (
        <Stack gap={2}>
          <Shelf justifyContent="space-between" gap={2}>
            <Text variant="heading2">Pool rating</Text>
            <Button variant="secondary" small onClick={() => push({ agency: '', value: '', reportUrl: '' })}>
              {form.values.poolRatings.length ? 'Add another' : 'Add'}
            </Button>
          </Shelf>
          <Stack gap={3}>
            {form.values.poolRatings.length
              ? form.values.poolRatings.map((rating, index) => (
                  <Shelf key={index} gap={2}>
                    <>
                      <Grid flex={1} columns={[1, 2]} equalColumns gap={2} rowGap={3}>
                        <FieldWithErrorMessage
                          name={`poolRatings.${index}.agency`}
                          as={TextInput}
                          label="Rating agency"
                          placeholder="Agency Name..."
                        />
                        <FieldWithErrorMessage
                          name={`poolRatings.${index}.value`}
                          as={TextInput}
                          label="Rating"
                          placeholder="Rating value..."
                        />
                        <FieldWithErrorMessage
                          name={`poolRatings.${index}.reportUrl`}
                          as={TextInput}
                          label="Rating report URL"
                          placeholder="https://..."
                        />
                      </Grid>
                    </>
                    <Box pt={1}>
                      <Button variant="tertiary" icon={IconMinusCircle} onClick={() => remove(index)} />
                    </Box>
                  </Shelf>
                ))
              : null}
          </Stack>
        </Stack>
      )}
    </FieldArray>
  )
}
