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

// tslint:disable-next-line:variable-name
const Number: FunctionComponent<Props> = ({ value, precision, decimalSeparator,
  thousandSeparator, allowNegative, prefix, suffix }: Props) => {
  return <span>{mask(value, precision, decimalSeparator, thousandSeparator,
                     allowNegative, prefix, suffix).maskedValue}</span>;
};

Number.defaultProps = {
  value: '0',
  decimalSeparator: '.',
  thousandSeparator: ',',
  precision: 2,
  allowNegative: false,
  prefix: '',
  suffix: '',
};

export default Number;
