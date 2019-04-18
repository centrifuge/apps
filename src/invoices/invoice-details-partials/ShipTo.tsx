import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';

import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';


interface ShipToProps {
  invoice: Invoice;
  columnGap: string;
};

export class ShipTo extends React.Component<ShipToProps> {
  displayName = 'ShipTo';

  render() {
    const {
      invoice,
      columnGap,
    } = this.props;

    return (
      <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Ship to company"
            value={invoice!.ship_to_company_name}
          />
          <DisplayField
            label="Name"
            value={invoice!.ship_to_contact_person_name}
          />
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Street"
            value={invoice!.ship_to_street1}
          />
          <DisplayField
            label="Street"
            value={invoice!.ship_to_street2}
          />
          <DisplayField
            label="City"
            value={invoice!.ship_to_city}
          />
          <DisplayField
            label="Country"
            value={invoice!.ship_to_country}
          />
          <DisplayField
            label="ZIP code"
            value={invoice!.ship_to_zipcode}
          />
        </Box>
      </Box>

    );

  }
}
