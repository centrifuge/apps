import { Decimal } from 'decimal.js-light'
import { FunctionComponent } from 'react'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'

interface Props {
  value: string
  precision?: number
  prefix?: string
  suffix?: string
  render?: (formatted: string, prefix: string | undefined, suffix: string | undefined) => React.ReactElement
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, prefix, suffix, render }: Props) => {
  const valueToDecimal = new Decimal(value.toString()).toFixed(precision)
  const formatted = addThousandsSeparators(valueToDecimal.toString())

  if (render) {
    return render(formatted, prefix, suffix)
  }

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
