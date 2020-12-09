import { TextInput } from 'grommet'
import * as React from 'react'
import NumberFormat, { NumberFormatValues } from 'react-number-format'

interface Props {
  value: string
  precision?: number
  prefix?: string
  suffix?: string
  onValueChange?: (values: NumberFormatValues) => void
  [key: string]: any
}

const NumberInput: React.FC<Props> = ({ value, precision, prefix, suffix, onValueChange, ...rest }: Props) => {
  return (
    <NumberFormat
      thousandSeparator=","
      decimalScale={precision}
      fixedDecimalScale
      allowNegative={false}
      prefix={prefix}
      suffix={suffix}
      customInput={TextInput}
      value={value}
      onValueChange={onValueChange}
      {...rest}
    />
  )
}

NumberInput.defaultProps = {
  value: '0',
  precision: 2,
  prefix: '',
  suffix: '',
}

export default NumberInput
