import React from 'react';
import { Box, Paragraph } from 'grommet';

import { Invoice, invoiceHasShipTo } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';


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

    const hasValues = invoiceHasShipTo(invoice);

    return (
      <Section headingLevel="5" title="Ship to" basis={'1/2'}>
        { hasValues ? <Box direction="row" gap={columnGap} basis={'1/2'}>
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
      </Box> : <Paragraph>Shipment was not sent to a third-party</Paragraph> }
      </Section>

    );

  }
}
