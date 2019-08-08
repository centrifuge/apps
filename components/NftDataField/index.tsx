import * as React from 'react';
import { FormField, TextInput } from 'grommet';
import NumberInput from '../NumberInput';
import { baseToDisplay, AbiOutput } from 'tinlake';

export interface NftDataDefinition {
  contractCall: {
    outputs: AbiOutput[],
  };
  displayedFields: DisplayedField[];
}

interface DisplayedFieldBase {
  key: string;
  label: string;
}

interface DisplayedFieldUint extends DisplayedFieldBase {
  type: 'uint';
  decimals?: number;
  precision?: number;
  suffix?: string;
}

interface DisplayedFieldAddress extends DisplayedFieldBase {
  type: 'address';
}

interface DisplayedFieldTimestamp extends DisplayedFieldBase {
  type: 'timestamp';
  decimals?: number;
  precision?: number;
  suffix?: string;
}

export type DisplayedField = DisplayedFieldUint | DisplayedFieldAddress | DisplayedFieldTimestamp;

interface Props {
  displayedField: DisplayedField;
  value: any;
}

class NftDataField extends React.Component<Props> {
  render() {
    const { displayedField: field, value } = this.props;

    if (field.type === 'uint') {
      const { label, decimals, precision, suffix } = field;

      return <FormField label={label}>
        <NumberInput value={baseToDisplay(value, decimals || 18)} suffix={suffix}
          precision={precision} disabled />
      </FormField>;
    }

    if (field.type === 'address') {
      const { label } = field;

      return <FormField label={label}>
        <TextInput value={value} disabled />
      </FormField>;
    }

    if (field.type === 'timestamp') {
      const { label } = field;
      const date = new Date(parseInt(baseToDisplay(value, -10)) * 1000)

      return <FormField label={label}>
        <TextInput value={date.toDateString()} disabled />
      </FormField>;
    }

    throw new Error(`Unsupported type "${(field as any).type}" given to NftDataField`);
  }
}

export default NftDataField;
