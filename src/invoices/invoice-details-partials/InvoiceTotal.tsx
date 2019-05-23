import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';


interface InvoiceTotalProps {
  invoice: Invoice;
  columnGap: string;
};

export class InvoiceTotal extends React.Component<InvoiceTotalProps> {
  displayName = 'InvoiceTotal';

  render() {
    const {
      invoice,
      columnGap,
    } = this.props;

    return (
      <Section headingLevel="5" title="Invoice Total">
        <Box direction="row" gap={columnGap}>

          <Box basis={'1/4'}>
            <DisplayField
              label="Net amount"
              value={invoice!.net_amount}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Tax rate"
              value={invoice!.tax_rate}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Tax amount"
              value={invoice!.tax_amount}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Gross amount"
              value={invoice!.gross_amount}
            />
          </Box>

        </Box>
      </Section>

    );

  }
}

