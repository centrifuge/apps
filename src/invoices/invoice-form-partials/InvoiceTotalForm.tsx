import React from 'react';
import { Link } from 'react-router-dom';
import { Box, FormField, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';


interface InvoiceTotalFormProps {
  columnGap: string;
};

interface ConnectedInvoiceTotalFormProps extends InvoiceTotalFormProps {
  formik: FormikContext<Invoice>;
};

export class InvoiceTotalForm extends React.Component<ConnectedInvoiceTotalFormProps> {
  displayName = 'InvoiceForm';

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
            label="Net amount"
            error={errors!.net_amount}
          >
            <TextInput
              name="net_amount"
              value={values!.net_amount}
              onChange={handleChange}
            />
          </FormField>
        </Box>

        <Box basis={'1/4'}>
          <FormField
            label="Tax rate"
            error={errors!.tax_rate}
          >
            <TextInput
              name="tax_rate"
              value={values!.tax_rate}
              onChange={handleChange}
            />
          </FormField>
        </Box>

        <Box basis={'1/4'}>
          <FormField
            label="Tax amount"
            error={errors!.tax_amount}
          >
            <TextInput
              name="tax_amount"
              value={values!.tax_amount}
              onChange={handleChange}
            />
          </FormField>
        </Box>

        <Box basis={'1/4'}>
          <FormField
            label="Gross amount"
            error={errors!.gross_amount}
          >
            <TextInput
              name="gross_amount"
              value={values!.gross_amount}
              onChange={handleChange}
            />
          </FormField>
        </Box>

      </Box>

    );

  }
}

export const ConnectedInvoiceTotalForm = connect<InvoiceTotalFormProps, Invoice>(InvoiceTotalForm);


