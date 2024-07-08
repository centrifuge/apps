import { Box, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { ErrorMessage, Field, FieldProps, getIn, useFormikContext } from 'formik'
import { min } from '../../../utils/validation'

type ChangeThresholdProps = {
  primaryText: string
  secondaryText: string
  isEditing: boolean
  fieldName: string
  signersFieldName: string
  minThreshold?: number
  validate?: (value: any) => string | undefined
  disabled?: boolean
  type: string
}

export const ChangeThreshold = ({
  primaryText,
  secondaryText,
  isEditing,
  fieldName,
  signersFieldName,
  minThreshold = 2,
  validate,
  disabled,
  type,
}: ChangeThresholdProps) => {
  const form = useFormikContext<any>()
  const threshold = getIn(form.values, fieldName)
  const signers = getIn(form.values, signersFieldName)

  return (
    <Stack gap={2}>
      <Text as="h3" variant="heading3">
        {primaryText}
      </Text>
      <Text as="p" variant="body2" color="textSecondary">
        {secondaryText}
      </Text>

      <Shelf gap={2}>
        {isEditing && (
          <Box maxWidth={150}>
            <Field name={fieldName} validate={validate ?? min(minThreshold, `Needs at least ${minThreshold} ${type}`)}>
              {({ field, form }: FieldProps) => (
                <Select
                  name={fieldName}
                  onChange={(event) => form.setFieldValue(fieldName, Number(event.target.value))}
                  onBlur={field.onBlur}
                  value={field.value}
                  options={signers.map((_: any, i: number) => ({
                    value: `${i + 1}`,
                    label: `${i + 1}`,
                    disabled: i < minThreshold - 1,
                  }))}
                  placeholder=""
                  disabled={disabled}
                />
              )}
            </Field>
          </Box>
        )}
        <Text>
          {!isEditing && threshold} out of {signers.length} {type}
        </Text>
      </Shelf>
      <Text variant="label2" color="statusCritical">
        <ErrorMessage name={fieldName} />
      </Text>
    </Stack>
  )
}
