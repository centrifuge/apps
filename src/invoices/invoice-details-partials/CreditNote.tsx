import React from 'react';
import { Box, Paragraph } from 'grommet';
import { formatDate } from '../../common/formaters';
import { Invoice, invoiceHasCreditNote } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';
import { Section } from '../../components/Section';

interface CreditNoteProps {
  invoice: Invoice;
  columnGap: string;
};


export class CreditNote extends React.Component<CreditNoteProps> {
  displayName = 'CreditNote';

  render() {
    const {
      columnGap,
      invoice,
    } = this.props;

    const hasValues = invoiceHasCreditNote(invoice);

    return (
      <Section headingLevel="5" title="Credit note" basis={'1/2'}>
        {hasValues ? <Box direction="row" gap={columnGap}>
          <Box flex="grow">
            <DisplayField
              label="Original invoice number"
              value={invoice!.credit_note_invoice_number}
            />

          </Box>
          <Box flex="grow">
            <DisplayField
              label="Original invoice date"
              value={formatDate(invoice!.credit_for_invoice_date)}
            />
          </Box>
        </Box> : <Paragraph>Invoice is not credit note</Paragraph>}

      </Section>
    );

  }
}
