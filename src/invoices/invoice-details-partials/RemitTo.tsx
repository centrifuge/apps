import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';

interface RemitToProps {
  invoice: Invoice;
  columnGap: string;
};

export class RemitTo extends React.Component<RemitToProps> {
  displayName = 'RemitTo';

  render() {

    const {
      invoice,
      columnGap,
    } = this.props;

    return (
      <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Remit to company"
            value={invoice!.remit_to_company_name}
          />

          <DisplayField
            label="Name"
            value={invoice!.remit_to_contact_person_name}
          />

          <DisplayField
            label="VAT number"
            value={invoice!.remit_to_vat_number}
          />

          <DisplayField
            label="Local tax ID"
            value={invoice!.remit_to_local_tax_id}
          />

          <DisplayField
            label="Tax country"
            value={invoice!.remit_to_tax_country}
          />
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Street"
            value={invoice!.remit_to_street1}
          />

          <DisplayField
            label="Street"
            value={invoice!.remit_to_street2}
          />

          <DisplayField
            label="City"
            value={invoice!.remit_to_city}
          />


          <DisplayField
            label="Country"
            value={invoice!.remit_to_country}
          />

          <DisplayField
            label="ZIP code"
            value={invoice!.remit_to_zipcode}
          />

        </Box>
      </Box>
    );

  }
}



