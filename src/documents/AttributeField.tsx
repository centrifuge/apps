import React, { FunctionComponent } from 'react';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { Attribute, AttrTypes } from '../common/models/schema';
import { Box, FormField, Select, TextInput } from 'grommet';
import { dateToString, extractDate } from '../common/formaters';
import { get } from 'lodash';
import { connect, FormikContext } from 'formik';
import { Document } from '../common/models/document';

type Props = OuterProps & {
  formik: FormikContext<Document>
};


interface OuterProps {
  attr: Attribute;
  isViewMode: boolean;
}

export const AttributeField: FunctionComponent<Props> = (props: Props) => {

  const {
    attr,
    isViewMode,
    formik: {
      values,
      errors,
      handleChange,
      setFieldValue
    }
  } = props;

  const key = `attributes.${attr.name}.value`;

  return <Box><FormField
    key={key}
    label={attr!.label}
    error={get(errors, key)}
  >
    {(() => {

      if (attr.options && attr.options.length > 0) {
        return <Select
          disabled={isViewMode}
          options={attr.options}
          value={get(values, key)}
          onChange={({ value }) => {
            setFieldValue(`${key}`, value.toString());
          }}
        />;
      }

      switch (attr.type) {
        case AttrTypes.STRING:
          return <TextInput
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            onChange={handleChange}
          />;
        case AttrTypes.BYTES:
          return <TextInput
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            onChange={handleChange}
          />;
        case AttrTypes.INTEGER:
          return <NumberInput
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            precision={0}
            onChange={({ value }) => {
              setFieldValue(`${key}`, value);
            }}
          />;
        case AttrTypes.DECIMAL:
          return <NumberInput
            disabled={isViewMode}
            value={get(values, key)}
            name={`${key}`}
            onChange={({ value }) => {
              setFieldValue(`${key}`, value);
            }}
          />;

        case AttrTypes.PERCENT:
          return <NumberInput
            disabled={isViewMode}
            suffix={'%'}
            value={get(values, key)}
            name={`${key}`}
            onChange={({ value }) => {
              setFieldValue(`${key}`, value);
            }}
          />;

        case AttrTypes.TIMESTAMP:
          return <DateInput
            disabled={isViewMode}
            value={extractDate(get(values, key))}
            name={`${key}`}
            onChange={date => {
              setFieldValue(`${key}`, dateToString(date));
            }}
          />;
      }
    })()}
  </FormField></Box>;
};

export default connect<OuterProps>(AttributeField);
