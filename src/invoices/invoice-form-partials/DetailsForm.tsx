import React from 'react';
import { Link } from 'react-router-dom';
import { Box, FormField, Select, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';
import { parseDate } from '../../common/parsers';


interface DetailsFormProps {
  columnGap: string;
};

interface ConnectedDetailsFormProps extends DetailsFormProps {
  formik: FormikContext<Invoice>;
};

export class DetailsForm extends React.Component<ConnectedDetailsFormProps> {
  displayName = 'DetailsForm';

  render() {
    const {
      errors,
      values,
      setFieldValue,
      handleChange,
    } = this.props.formik;

    const {
      columnGap,
    } = this.props;

    return (
      <Box direction="row" gap={columnGap}>


        <Box basis={'1/4'}>
          <FormField
            label="Invoice Status"
            error={errors!.status}
          >
            <Select
              placeholder="Select"
              value={values!.status}
              options={['unpaid', 'paid']}
              onChange={({ option }) => setFieldValue('status', option)}
            />
          </FormField>
        </Box>

        <Box basis={'1/4'}>
          <FormField
            label="Currency"
            error={errors!.currency}
          >
            <Select
              placeholder="Select"
              value={values!.currency}
              options={['USD', 'EUR']}
              onChange={({ option }) => setFieldValue('currency', option)}
            />

          </FormField>
        </Box>

        <Box basis={'1/4'}>
          <FormField
            label="Invoice date"
            error={errors!.date_created}
          >
            <TextInput
              name="date_created"
              type="date"
              value={dateFormatter(values!.date_created)}
              onChange={ ev => {
                setFieldValue('date_created',  parseDate(ev.target.value))
              }}
            />
          </FormField>
        </Box>


        <Box basis={'1/4'}>
          <FormField
            label="Due date"
            error={errors!.date_due}
          >
            <TextInput
              name="date_due"
              type="date"
              value={dateFormatter(values!.date_due)}
              onChange={ ev => {
                setFieldValue('date_due',  parseDate(ev.target.value))
              }}
            />
          </FormField>
        </Box>

      </Box>
    );

  }
}

export const ConnectedDetailsForm = connect<DetailsFormProps, Invoice>(DetailsForm);


