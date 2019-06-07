import React from 'react';
import { Link } from 'react-router-dom';
import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';
import { Section } from '../../components/Section';
import { Box, FormField, Select, TextInput } from 'grommet';
import { dateToString, extractDate } from '../../common/formaters';


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


    values.tax_amount = (parseFloat(values.net_amount || '') * parseFloat(values.tax_rate || '')).toFixed(2);
    values.gross_amount = (parseFloat(values.net_amount || '') + parseFloat(values.tax_amount || '')).toFixed(2);

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
              label="Date created"
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
                  value={(parseFloat(values.tax_rate || '') * 100)}
                  onChange={(ev) => {
                    const no = parseFloat(ev.target.value);
                    setFieldValue('tax_rate', ((isNaN(no) ? 0 : no) / 100).toString());
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
        </Box>
      </Section>

    );

  }
}

export const ConnectedDetailsForm = connect<DetailsFormProps, Invoice>(DetailsForm);


