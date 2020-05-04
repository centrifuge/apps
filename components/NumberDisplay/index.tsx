import { FunctionComponent } from 'react';
import { Decimal } from 'decimal.js-light';

interface Props {
  value: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, prefix, suffix }: Props) => {
  if (value.toString().includes('-')) {
    value = '0';
  }

  Decimal.set({
    precision
  });

  const valueToDecimal  = new Decimal(value.toString()).toFixed(precision);
  const formatted = valueToDecimal.toString();
  return <span>{prefix}{formatted}{suffix}</span>;
};

NumberDisplay.defaultProps = {
  value: '0',
  precision: 2,
  prefix: '',
  suffix: ''
};

export default NumberDisplay;
