import React from 'react';
import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';
import { Section } from '../../components/Section';
import { Box, FormField, Select, TextInput } from 'grommet';
import { dateToString, extractDate, getCurrencyFormat, getPercentFormat } from '../../common/formaters';
import { NumberInput } from '@centrifuge/axis-number-input';

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
    } = this.props.formik;

    const {
      columnGap,
    } = this.props;


    values.tax_amount = (parseFloat(values.net_amount || '') * (parseFloat(values.tax_rate || ''))/100).toFixed(2);
    values.gross_amount = (parseFloat(values.net_amount || '') + parseFloat(values.tax_amount || '')).toFixed(2);
    const currencyParts = getCurrencyFormat(values.currency);
    const percentParts = getPercentFormat();

    return (
      <Section headingLevel="5" title="Invoice Details">
        <Box gap={columnGap}>
          <Box direction="row" gap={columnGap}>
            <Box basis={'1/4'}>
              <FormField
                label="Status"
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
                  value={extractDate(values!.date_created)}
                  onChange={ev => {
                    setFieldValue('date_created', dateToString(ev.target.value));
                  }}
                />
              </FormField>
            </Box>

            <Box basis={'1/4'}>
              <FormField
                label="Date due"
                error={errors!.date_due}
              >
                <TextInput
                  name="date_due"
                  type="date"
                  value={extractDate(values!.date_due)}
                  onChange={ev => {
                    setFieldValue('date_due', dateToString(ev.target.value));
                  }}
                />
              </FormField>
            </Box>
          </Box>
          <Box direction="row" gap={columnGap}>

            <Box basis={'1/4'}>
              <FormField
                label={`Net amount, ${values.currency}`}
                error={errors!.net_amount}
              >

                <NumberInput
                  {...currencyParts}
                  name="net_amount"
                  value={values.net_amount}
                  onChange={(masked, value) => {
                    setFieldValue('net_amount', value+'');
                  }}
                />

              </FormField>
            </Box>

            <Box basis={'1/4'}>
              <FormField
                label="Tax rate"
                error={errors!.tax_rate}
              >
                <NumberInput
                  {...percentParts}
                  name="tax_rate"
                  value={values.tax_rate}
                  onChange={(masked, value) => {
                    setFieldValue('tax_rate', value+'');
                  }}
                />
              </FormField>
            </Box>

            <Box basis={'1/4'}>
              <FormField
                label={`Tax amount`}
                error={errors!.tax_amount}
              >
                <NumberInput
                  {...currencyParts}
                  disabled={true}
                  name="tax_amount"
                  value={values.tax_amount}
                />
              </FormField>
            </Box>

            <Box basis={'1/4'}>
              <FormField
                label={`Gross amount`}
                error={errors!.gross_amount}
              >
                <NumberInput
                  {...currencyParts}
                  disabled={true}
                  name="gross_amount"
                  value={values.gross_amount}
                />
              </FormField>
            </Box>

          </Box>
        </Box>
      </Section>

    );

  }
}

export const ConnectedDetailsForm = connect<DetailsFormProps, Invoice>(DetailsForm);


