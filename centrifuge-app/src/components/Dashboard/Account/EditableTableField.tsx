import { Box, CurrencyInput, Text } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { formatBalance } from '../../../../src/utils/formatting'

export const EditableTableField = ({ name, loanId }: { name: string; loanId: string }) => {
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Box ref={containerRef}>
      <Field name={name}>
        {({ field, form }: FieldProps) =>
          isFocused ? (
            <CurrencyInput
              {...field}
              autoFocus
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={field.value || ''}
              onChange={(value) => {
                form.setFieldValue(field.name, value)
                const quantity = form.values[loanId]?.quantity || 0
                if (typeof value === 'number') {
                  form.setFieldValue(`${loanId}.newValue`, value * quantity)
                }
              }}
            />
          ) : (
            <Text onClick={() => setIsFocused(true)} variant="body3">
              {field.value ? formatBalance(field.value) : 0}
            </Text>
          )
        }
      </Field>
    </Box>
  )
}
