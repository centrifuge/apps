import mask from '../../utils/mask';
import { FunctionComponent } from 'react';

interface Props {
  value: string;
  decimalSeparator?: '.' | ',';
  thousandSeparator?: ',' | '.';
  precision?: number;
  allowNegative?: boolean;
  prefix?: string;
  suffix?: string;
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, decimalSeparator,
  thousandSeparator, allowNegative, prefix, suffix }: Props) => {
  const formatted = Number(Number.parseFloat(value))
    .toLocaleString(undefined, { style: 'decimal',
      minimumFractionDigits: precision, maximumFractionDigits: precision });

  return <span>{mask(formatted, precision, decimalSeparator, thousandSeparator,
                     allowNegative, prefix, suffix).maskedValue}</span>;
};

NumberDisplay.defaultProps = {
  value: '0',
  decimalSeparator: '.',
  thousandSeparator: ',',
  precision: 2,
  allowNegative: true,
  prefix: '',
  suffix: '',
};

export default NumberDisplay;
