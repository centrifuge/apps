import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { LabelValuePair } from '../../common/interfaces';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
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
      <Section headingLevel="5" title="Sender" basis={'1/2'}>
        <Box direction="row" gap={columnGap} basis={'1/2'}>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Centrifuge ID"
            value={invoice.sender}
          />
          <DisplayField
            label="Company name"
            value={invoice!.sender_company_name}
          />
        </Box>
        <Box gap={columnGap} basis={'1/2'}>
          <DisplayField
            label="Street"
            value={invoice!.sender_street1}
          />
          <DisplayField
            label="Street"
            value={invoice!.sender_street2}
          />
          <DisplayField
            label="City"
            value={invoice!.sender_city}
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



