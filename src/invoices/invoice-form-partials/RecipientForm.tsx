import React from 'react';
import { Link } from 'react-router-dom';
import { FormField, TextInput,Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { LabelValuePair } from '../../common/interfaces';
import SearchSelect from '../../components/form/SearchSelect';
import { Invoice } from '../../common/models/invoice';

interface RecipientFormProps {
  contacts: LabelValuePair[];
  columnGap: string
};

interface ConnectedRecipientFormProps extends RecipientFormProps {
  formik: FormikContext<Invoice>;
};

export class RecipientForm extends React.Component<ConnectedRecipientFormProps> {
  displayName = 'RecipientForm';

  render() {
    const {
      errors,
      values,
      setFieldValue,
      handleChange,
    } = this.props.formik;

    const {
      contacts,
      columnGap,
    } = this.props;

    return (
      <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Centrifuge ID"
            error={errors!.recipient}
          >
            <SearchSelect
              onChange={(value) => setFieldValue('recipient', value)}
              options={contacts}
              selected={
                contacts.find(
                  contact =>
                    contact.value === values!.recipient,
                )
              }
            />
          </FormField>
          <FormField
            label="Company name"
            error={errors!.bill_to_company_name}
          >
            <TextInput
              name="bill_to_company_name"
              value={values!.bill_to_company_name}
              onChange={handleChange}
            />
          </FormField>
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Street"
            error={errors!.bill_to_street1}
          >
            <TextInput
              name="bill_to_street1"
              placeholder="Street name and number"
              value={values!.bill_to_street1}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Street"
            error={errors!.bill_to_street2}
          >
            <TextInput
              name="bill_to_street2"
              placeholder="Apartment, unit, office, etc"
              value={values!.bill_to_street2}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="City"
            error={errors!.bill_to_city}
          >
            <TextInput
              name="bill_to_city"
              placeholder="City or state"
              value={values!.bill_to_city}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Country"
            error={errors!.bill_to_country}
          >
            <TextInput
              name="bill_to_country"
              value={values!.bill_to_country}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="ZIP code"
            error={errors!.bill_to_zipcode}
          >
            <TextInput
              name="bill_to_zipcode"
              value={values!.bill_to_zipcode}
              onChange={handleChange}
            />
          </FormField>
        </Box>
      </Box>
    );

  }
}


export const ConnectedRecipientForm = connect<RecipientFormProps, Invoice>(RecipientForm);


