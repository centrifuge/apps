import React from 'react';
import { Link } from 'react-router-dom';
import { Box, FormField, TextInput } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { connect, FormikContext } from 'formik';
import { Invoice } from '../../common/models/invoice';


interface ShipToFormProps {
  columnGap: string;
};

interface ConnectedShipToFormProps extends ShipToFormProps {
  formik: FormikContext<Invoice>;
};

export class ShipToForm extends React.Component<ConnectedShipToFormProps> {
  displayName = 'ShipToForm';

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
            label="Ship to company"
            error={errors!.ship_to_company_name}
          >
            <TextInput
              name="ship_to_company_name"
              value={values!.ship_to_company_name}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Name"
            error={errors!.ship_to_contact_person_name}
          >
            <TextInput
              name="ship_to_contact_person_name"
              value={values!.ship_to_contact_person_name}
              onChange={handleChange}
            />
          </FormField>
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <FormField
            label="Street"
            error={errors!.ship_to_street1}
          >
            <TextInput
              placeholder="Street name and number"
              name="ship_to_street1"
              value={values!.ship_to_street1}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Street"
            error={errors!.ship_to_street2}
          >
            <TextInput
              placeholder="Apartment, unit, office, etc"
              name="ship_to_street2"
              value={values!.ship_to_street2}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="City"
            error={errors!.ship_to_city}
          >
            <TextInput
              name="ship_to_city"
              placeholder="City or state"
              value={values!.ship_to_city}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="Country"
            error={errors!.ship_to_country}
          >
            <TextInput
              name="ship_to_country"
              value={values!.ship_to_country}
              onChange={handleChange}
            />
          </FormField>
          <FormField
            label="ZIP code"
            error={errors!.ship_to_zipcode}
          >
            <TextInput
              name="ship_to_zipcode"
              value={values!.ship_to_zipcode}
              onChange={handleChange}
            />
          </FormField>
        </Box>
      </Box>

    );

  }
}

export const ConnectedShipToForm = connect<ShipToFormProps, Invoice>(ShipToForm);


