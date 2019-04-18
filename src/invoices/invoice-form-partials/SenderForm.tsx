import React from 'react';
import { Link } from 'react-router-dom';
import { Box, FormField, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { LabelValuePair } from '../../common/interfaces';
import SearchSelect from '../../components/form/SearchSelect';
import { Invoice } from '../../common/models/invoice';


interface SenderFormProps {
  contacts: LabelValuePair[];
  columnGap: string;
};

interface ConnectedSenderFormProps extends SenderFormProps {
  formik: FormikContext<Invoice>;
};

export class SenderForm extends React.Component<ConnectedSenderFormProps> {
  displayName = 'SenderForm';

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
            error={errors!.sender}
          >
            <SearchSelect
              onChange={(value) => setFieldValue('sender', value)}
              options={contacts}
              selected={
                contacts.find(
                  contact =>
                    contact.value === values!.sender,
                )
              }
            />
          </FormField>
          <FormField
            label="Company name"
            error={errors!.sender_company_name}
          >
            <TextInput
              name="sender_company_name"
              value={values!.sender_company_name}
              onChange={handleChange}
            />
          </FormField>
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Street"
            error={errors!.sender_street1}
          >
            <TextInput
              name="sender_street1"
              placeholder="Street name and number"
              value={values!.sender_street1}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Street"
            error={errors!.sender_street2}
          >
            <TextInput
              name="sender_street2"
              placeholder="Apartment, unit, office, etc"
              value={values!.sender_street2}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="City"
            error={errors!.sender_city}
          >
            <TextInput
              name="sender_city"
              placeholder="City or state"
              value={values!.sender_city}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Country"
            error={errors!.sender_country}
          >
            <TextInput
              name="sender_country"
              value={values!.sender_country}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="ZIP code"
            error={errors!.sender_zipcode}
          >
            <TextInput
              name="sender_zipcode"
              value={values!.sender_zipcode}
              onChange={handleChange}
            />
          </FormField>

        </Box>
      </Box>
    );

  }
}

export const ConnectedSenderForm = connect<SenderFormProps, Invoice>(SenderForm);


