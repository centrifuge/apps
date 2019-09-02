import React from 'react';
import { Box } from 'grommet';
import { LabelValuePair } from '../../common/interfaces';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '@centrifuge/axis-display-field';
import { Section } from '../../components/Section';


interface SenderProps {
  invoice: Invoice;
  contacts: LabelValuePair[];
  columnGap: string;
};


export class Sender extends React.Component<SenderProps> {
  displayName = 'Sender';

  render() {

    const {
      invoice,
      columnGap,
    } = this.props;

    return (
      <Section headingLevel="5" title="Sender" basis={'1/2'} pad={{horizontal:'medium',vertical:"medium",right:'none'}}>
        <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>

          <DisplayField
            label="Name"
            value={invoice!.sender_company_name}
          />
          <DisplayField
            label="Centrifuge ID"
            value={invoice.sender}
          />
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Street 1"
            value={invoice!.sender_street_1}
          />
          <DisplayField
            label="Street 2"
            value={invoice!.sender_street_2}
          />
          <DisplayField
            label="City"
            value={invoice!.sender_city}
          />
          <DisplayField
            label="State"
            value={invoice!.sender_state}
          />
          <DisplayField
            label="Country"
            value={invoice!.sender_country}
          />
          <DisplayField
            label="ZIP code"
            value={invoice!.sender_zipcode}
          />
        </Box>
      </Box>
      </Section>
    );

  }
}



