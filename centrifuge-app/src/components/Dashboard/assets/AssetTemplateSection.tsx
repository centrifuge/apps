import { CurrencyInput, DateInput, NumberInput, Select, TextAreaInput, TextInput } from '@centrifuge/fabric'
import { Field, FieldProps } from 'formik'
import { combine, max, min, positiveNumber, required } from '../../../utils/validation'
import { FieldWithErrorMessage } from '../../FieldWithErrorMessage'

export function AssetTemplateSection({ label, input, name }: { label: string; input: any; name: string }) {
  switch (input.type) {
    case 'single-select':
      return (
        <Field name={name} validate={required()} key={label}>
          {({ field, form }: any) => (
            <Select
              placeholder="Select one"
              label={`${label}*`}
              options={input.options.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : o))}
              value={field.value ?? ''}
              onChange={(event) => {
                form.setFieldValue(name, event.target.value)
              }}
            />
          )}
        </Field>
      )
    case 'currency': {
      return (
        <Field
          name={name}
          validate={combine(required(), positiveNumber(), min(input.min ?? -Infinity), max(input.max ?? Infinity))}
          key={label}
        >
          {({ field, meta, form }: FieldProps) => {
            return (
              <CurrencyInput
                {...field}
                label={`${label}*`}
                errorMessage={meta.touched ? meta.error : undefined}
                currency={input.symbol}
                placeholder="0.00"
                onChange={(value) => form.setFieldValue(name, value)}
                min={input.min}
                max={input.max}
              />
            )
          }}
        </Field>
      )
    }
    case 'number':
      return (
        <FieldWithErrorMessage
          name={name}
          as={NumberInput}
          label={`${label}*`}
          placeholder={input.placeholder}
          validate={combine(required(), min(input.min ?? -Infinity), max(input.max ?? Infinity))}
          symbol={input.unit}
          min={input.min}
          max={input.max}
        />
      )
    case 'date':
      return (
        <FieldWithErrorMessage
          name={name}
          as={DateInput}
          label={`${label}*`}
          placeholder={input.placeholder}
          validate={required()}
          min={input.min}
          max={input.max}
        />
      )

    default: {
      const { type, ...rest } = input.type as any
      return (
        <FieldWithErrorMessage
          name={name}
          as={type === 'textarea' ? TextAreaInput : TextInput}
          label={`${label}*`}
          validate={required()}
          {...rest}
        />
      )
    }
  }
}
