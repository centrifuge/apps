import React from 'react';
import { Link } from 'react-router-dom';
import { FormField, TextInput,Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { LabelValuePair } from '../../common/interfaces';
import SearchSelect from '../../components/form/SearchSelect';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';


interface PaymentFormProps  {
  contacts: LabelValuePair[];
  columnGap:string;
};

interface ConnectedPaymentFormProps extends PaymentFormProps {
  formik: FormikContext<Invoice>;
};

export class PaymentForm extends React.Component<ConnectedPaymentFormProps> {
  displayName = 'PaymentForm';
  render() {
    const {
      errors,
      values,
      setFieldValue,
      handleChange,
    } = this.props.formik;

    const {
      columnGap,
      contacts
    } = this.props;

    return (
      <Box  gap={columnGap} flex="grow">
        <Box direction="row" gap={columnGap}>
          <Box basis={'1/4'}>
            <FormField
              label="Payee"
              error={errors!.payee}
            >
              <SearchSelect
                onChange={(value) => setFieldValue('payee', value)}
                options={contacts}
                selected={
                  contacts.find(
                    contact =>
                      contact.value === values!.payee,
                  )
                }
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
                value={dateFormatter(values!.date_created)}
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
        </Box>
        <Box direction="row" gap={columnGap} flex="grow">

          <Box basis={'1/4'}>
            <FormField
              label="Currency"
              error={errors!.currency}
            >
              <TextInput
                name="currency"
                value={values!.currency}
                onChange={handleChange}
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
                onChange={handleChange}
              />
            </FormField>
          </Box>
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

        </Box>
      </Box>
    );

  }
}

export const ConnectedPaymentForm =  connect<PaymentFormProps,Invoice>(PaymentForm);


