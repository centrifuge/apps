import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';


interface DetailsProps {
  invoice: Invoice;
  columnGap: string;
};

export class Details extends React.Component<DetailsProps> {
  displayName = 'Details';

  render() {
    const {
      invoice,
      columnGap,
    } = this.props;


    return (
      <Section headingLevel="5" title="Details">
        <Box direction="row" gap={columnGap} flex="grow">
          <Box basis={'1/4'}>
            <DisplayField
              label="Invoice Status"
              value={invoice!.status}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Currency"
              value={invoice!.currency}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Date created"
              value={dateFormatter(invoice!.date_created)}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Due date"
              value={dateFormatter(invoice!.date_due)}
            />
          </Box>

        </Box>
      </Section>
    );

  }
}

