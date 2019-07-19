import React from 'react';
import { Box, FormField, TextInput } from 'grommet';
import { connect, FormikContext } from 'formik';
import { LabelValuePair } from '../../common/interfaces';
import { Invoice } from '../../common/models/invoice';
import { Section } from '../../components/Section';


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
      handleChange,
    } = this.props.formik;

    const {
      columnGap,
    } = this.props;

    return (
      <Section headingLevel="5" title="Sender" basis={'1/2'}
               pad={{ horizontal: 'medium', vertical: 'medium', right: 'none' }}>
        <Box direction="row" gap={columnGap}>
          <Box gap={columnGap} basis={'1/2'}>
            <FormField
              label="Name"
              error={errors!.sender}
            >
              <TextInput
                disabled={true}
                name="sender_company_name"
                value={values!.sender_company_name}
                onChange={handleChange}
              />

            </FormField>

          </Box>
          <Box gap={columnGap} basis={'1/2'}>
            <FormField
              label="Street 1"
              error={errors!.sender_street_1}
            >
              <TextInput
                name="sender_street_1"
                placeholder="Street name and number"
                value={values!.sender_street_1}
                onChange={handleChange}
              />
            </FormField>
            <FormField
              label="Street 2"
              error={errors!.sender_street_2}
            >
              <TextInput
                name="sender_street_2"
                placeholder="Apartment, unit, office, etc"
                value={values!.sender_street_2}
                onChange={handleChange}
              />
            </FormField>
            <FormField
              label="City"
              error={errors!.sender_city}
            >
              <TextInput
                name="sender_city"
                value={values!.sender_city}
                onChange={handleChange}
              />
            </FormField>
            <FormField
              label="State"
              error={errors!.sender_state}
            >
              <TextInput
                name="sender_state"
                value={values!.sender_state}
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
      </Section>

    );

  }
}

export const ConnectedSenderForm = connect<SenderFormProps, Invoice>(SenderForm);


