import React from 'react';
import { Link } from 'react-router-dom';
import { FormField, TextInput,Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';

interface RemitToProps {
  columnGap: string;
};

interface ConnectedRemitToProps extends RemitToProps {
  formik: FormikContext<Invoice>;
};

export class RemitToForm extends React.Component<ConnectedRemitToProps> {
  displayName = 'RemitTo';

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
      <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Remit to company"
            error={errors!.remit_to_company_name}
          >
            <TextInput
              name="remit_to_company_name"
              value={values!.remit_to_company_name}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Name"
            error={errors!.remit_to_contact_person_name}
          >
            <TextInput
              name="remit_to_contact_person_name"
              value={values!.remit_to_contact_person_name}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="VAT number"
            error={errors!.remit_to_vat_number}
          >
            <TextInput
              name="remit_to_vat_number"
              value={values!.remit_to_vat_number}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Local tax ID"
            error={errors!.remit_to_local_tax_id}
          >
            <TextInput
              name="remit_to_local_tax_id"
              value={values!.remit_to_local_tax_id}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Tax country"
            error={errors!.remit_to_tax_country}
          >
            <TextInput
              name="remit_to_tax_country"
              value={values!.remit_to_tax_country}
              onChange={handleChange}
            />
          </FormField>

        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Street"
            error={errors!.remit_to_street1}
          >
            <TextInput
              placeholder="Street name and number"
              name="remit_to_street1"
              value={values!.remit_to_street1}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Street"
            error={errors!.remit_to_street2}
          >
            <TextInput
              placeholder="Apartment, unit, office, etc"
              name="remit_to_street2"
              value={values!.remit_to_street2}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="City"
            error={errors!.remit_to_city}
          >
            <TextInput
              name="remit_to_city"
              placeholder="City or state"
              value={values!.remit_to_city}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Country"
            error={errors!.remit_to_country}
          >
            <TextInput
              name="remit_to_country"
              value={values!.remit_to_country}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="ZIP code"
            error={errors!.remit_to_zipcode}
          >
            <TextInput
              name="remit_to_zipcode"
              value={values!.remit_to_zipcode}
              onChange={handleChange}
            />
          </FormField>
        </Box>
      </Box>
    );

  }
}

export const ConnectedRemitToForm = connect<RemitToProps, Invoice>(RemitToForm);


