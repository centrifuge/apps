import mask from '../../utils/mask';
import { FunctionComponent } from 'react';

interface Props {
  value: string;
  decimalSeparator?: '.' | ',';
  thousandSeparator?: ',' | '.';
  precision?: number;
  allowNegative?: false;
  prefix?: string;
  suffix?: string;
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, decimalSeparator,
  thousandSeparator, allowNegative, prefix, suffix }: Props) => {
  const formatted = Number(Number.parseFloat(value))
    .toLocaleString(undefined, { style: 'decimal',
      minimumFractionDigits: 18, maximumFractionDigits: 18 });

  return <span>{mask(formatted, precision, decimalSeparator, thousandSeparator,
                     allowNegative, prefix, suffix).maskedValue}</span>;
};

NumberDisplay.defaultProps = {
  value: '0',
  decimalSeparator: '.',
  thousandSeparator: ',',
  precision: 2,
  allowNegative: false,
  prefix: '',
  suffix: '',
};

export default NumberDisplay;
