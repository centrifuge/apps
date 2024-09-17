import { Grid, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'

export function PoolRatingInput() {
  return (
    <Stack gap={2}>
      <Text variant="heading2">Pool rating</Text>
      <Grid columns={[1, 2]} equalColumns gap={2} rowGap={3}>
        <FieldWithErrorMessage name="ratingAgency" as={TextInput} label="Rating agency" placeholder="Agency Name..." />
        <FieldWithErrorMessage name="ratingValue" as={TextInput} label="Rating" placeholder="Rating value..." />
        <FieldWithErrorMessage
          name="ratingReportUrl"
          as={TextInput}
          label="Rating report URL"
          placeholder="https://..."
        />
      </Grid>
    </Stack>
  )
}
