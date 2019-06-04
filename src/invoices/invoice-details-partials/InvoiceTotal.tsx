import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';
import { formatCurrency, formatPercent } from '../../common/formaters';


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
              value={formatCurrency(invoice!.net_amount,invoice.currency)}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Tax rate"
              value={formatPercent(invoice!.tax_rate)}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Tax amount"
              value={formatCurrency(invoice!.tax_amount,invoice.currency)}
            />
          </Box>

          <Box basis={'1/4'}>
            <DisplayField
              label="Gross amount"
              value={formatCurrency(invoice!.gross_amount, invoice.currency)}
            />
          </Box>

        </Box>
      </Section>

    );

  }
}

