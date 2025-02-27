import { CurrencyInput, Text } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { useState } from 'react'
import { formatBalance } from '../../../../src/utils/formatting'

export const EditableTableField = ({ name }: { name: string }) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  return (
    <Field name={name}>
      {({ field }: FieldProps) =>
        isFocused ? (
          <CurrencyInput
            {...field}
            autoFocus
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={field.value || ''}
            small
          />
        ) : (
          <Text onClick={handleFocus} variant="body3">
            {field.value ? formatBalance(field.value) : 0}
          </Text>
        )
      }
    </Field>
  )
}
