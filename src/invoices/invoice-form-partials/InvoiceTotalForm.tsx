import React from 'react';
import { Link } from 'react-router-dom';
import { Box, FormField, TextInput } from 'grommet';

import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';
import { Section } from '../../components/Section';


interface InvoiceTotalFormProps {
  columnGap: string;
};

interface ConnectedInvoiceTotalFormProps extends InvoiceTotalFormProps {
  formik: FormikContext<Invoice>;
};

export class InvoiceTotalForm extends React.Component<ConnectedInvoiceTotalFormProps> {
  displayName = 'InvoiceTotalForm';

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

    values.tax_amount = (parseFloat(values.net_amount) * parseFloat(values.tax_rate)).toFixed(2);
    values.gross_amount = (parseFloat(values.net_amount) + parseFloat(values.tax_amount)).toFixed(2);

    return (
      <Section headingLevel="5" title="Invoice Total">
        <Box direction="row" gap={columnGap}>

          <Box basis={'1/4'}>
            <FormField
              label={`Net amount, ${values.currency}`}
              error={errors!.net_amount}
            >
              <TextInput
                name="net_amount"
                maxLength={22}
                value={values.net_amount}
                onChange={handleChange}
              />
            </FormField>
          </Box>

          <Box basis={'1/4'}>
            <FormField
              label="Tax rate, %"
              maxLength={4}
              error={errors!.tax_rate}
            >
              <TextInput
                name="tax_rate"
                value={(values.tax_rate * 100)}
                onChange={(ev) => {

                  setFieldValue('tax_rate', ((isNaN(ev.target.value) ? 0 : ev.target.value) / 100).toString());
                }}
              />
            </FormField>
          </Box>

          <Box basis={'1/4'}>
            <FormField
              label={`Tax amount, ${values.currency}`}
              error={errors!.tax_amount}
            >
              <TextInput
                disabled={true}
                name="tax_amount"
                value={values!.tax_amount}
                onChange={handleChange}
              />
            </FormField>
          </Box>

          <Box basis={'1/4'}>
            <FormField
              label={`Gross amount, ${values.currency}`}
              error={errors!.gross_amount}
            >
              <TextInput
                disabled={true}
                name="gross_amount"
                value={values!.gross_amount}
                onChange={handleChange}
              />
            </FormField>
          </Box>

        </Box>
      </Section>

    );

  }
}

export const ConnectedInvoiceTotalForm = connect<InvoiceTotalFormProps, Invoice>(InvoiceTotalForm);


