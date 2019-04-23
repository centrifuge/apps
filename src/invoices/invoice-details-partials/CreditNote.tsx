import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';

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

    return (
      <>
        <Box direction="row" basis={'1/2'} gap={columnGap}>
          <Box flex="grow">
            <DisplayField
              label="Original invoice number"
              value={invoice!.credit_note_invoice_number}
            />

          </Box>
          <Box flex="grow">
            <DisplayField
              label="Original invoice date"
              value={dateFormatter(invoice!.credit_for_invoice_date)}
            />
          </Box>
        </Box>
      </>
    );

  }
}
