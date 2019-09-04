import React from 'react';
import { Box } from 'grommet';
import { LabelValuePair } from '../../common/interfaces';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Section } from '../../components/Section';

interface RecipientProps {
  invoice: Invoice;
  contacts: LabelValuePair[];
  columnGap: string
};


export class Recipient extends React.Component<RecipientProps> {
  displayName = 'Recipient';

  render() {

    const {
      invoice,
      columnGap,
    } = this.props;


    return (
      <Section headingLevel="5" title="Recipient" basis={'1/2'} pad={{horizontal:'medium',vertical:"medium",left:'none'}}>
        <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>

          <DisplayField
            label="Name"
            value={invoice!.bill_to_company_name}
          />
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Street 1"
            value={invoice!.bill_to_street_1}
          />
          <DisplayField
            label="Street 2"
            value={invoice!.bill_to_street_2}
          />
          <DisplayField
            label="City"
            value={invoice!.bill_to_city}
          />
          <DisplayField
            label="State"
            value={invoice!.bill_to_state}
          />
          <DisplayField
            label="Country"
            value={invoice!.bill_to_country}
          />
          <DisplayField
            label="ZIP code"
            value={invoice!.bill_to_zipcode}
          />
        </Box>
      </Box>
      </Section>
    );

  }
}

