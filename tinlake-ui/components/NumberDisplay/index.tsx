import { Decimal } from 'decimal.js-light'
import { FunctionComponent } from 'react'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'

interface Props {
  value: string
  precision?: number
  prefix?: string
  suffix?: string
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, prefix, suffix }: Props) => {
  const valueToDecimal = new Decimal(value.toString()).toFixed(precision)
  const formatted = addThousandsSeparators(valueToDecimal.toString())
  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

NumberDisplay.defaultProps = {
  value: '0',
  precision: 2,
  prefix: '',
  suffix: '',
}

export default NumberDisplay
