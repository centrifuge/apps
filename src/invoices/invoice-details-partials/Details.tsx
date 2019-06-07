import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { formatCurrency, formatDate, formatPercent } from '../../common/formaters';
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
      <Section headingLevel="5" title="Invoice Details">
        <Box  gap={columnGap}>
          <Box direction="row" gap={columnGap} flex="grow">
            <Box basis={'1/4'}>
              <DisplayField
                label="Status"
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
                value={formatDate(invoice!.date_created)}
              />
            </Box>

            <Box basis={'1/4'}>
              <DisplayField
                label="Date due"
                value={formatDate(invoice!.date_due)}
              />
            </Box>
          </Box>
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
        </Box>


      </Section>
    );

  }
}

