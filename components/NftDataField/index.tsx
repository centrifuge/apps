import * as React from 'react';
import { FormField, TextInput } from 'grommet';
import NumberInput from '../NumberInput';
import { baseToDisplay } from 'tinlake';

interface FieldDefinitionBase {
  key: string;
  label: string;
}

interface FieldDefinitionUint extends FieldDefinitionBase {
  type: 'uint';
  decimals?: number;
  precision?: number;
  suffix?: string;
}

interface FieldDefinitionAddress extends FieldDefinitionBase {
  type: 'address';
}

export type FieldDefinition = FieldDefinitionUint | FieldDefinitionAddress;

interface Props {
  fieldDefinition: FieldDefinition;
  value: any;
}

class NftDataField extends React.Component<Props> {
  render() {
    const { fieldDefinition: fieldDef, value } = this.props;

    if (fieldDef.type === 'uint') {
      const { label, decimals, precision, suffix } = fieldDef;

      return <FormField label={label}>
        <NumberInput value={baseToDisplay(value, decimals || 18)} suffix={suffix}
          precision={precision} disabled />
      </FormField>;
    }

    if (fieldDef.type === 'address') {

      const { label } = fieldDef;

      return <FormField label={label}>
        <TextInput value={value} disabled />
      </FormField>;
    }

    throw new Error(`Unsupported type "${(fieldDef as any).type}" given to NftDataField`);
  }
}

export default NftDataField;
