import { FunctionComponent } from 'react';

interface Props {
  value: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
}

const NumberDisplay: FunctionComponent<Props> = ({ value, precision, prefix, suffix }: Props) => {
  const formatted = parseFloat(value)
    .toLocaleString('en-GB', { style: 'decimal',
      minimumFractionDigits: precision, maximumFractionDigits: precision });

  return <span>{prefix}{formatted}{suffix}</span>;
};

NumberDisplay.defaultProps = {
  value: '0',
  precision: 2,
  prefix: '',
  suffix: ''
};

export default NumberDisplay;
