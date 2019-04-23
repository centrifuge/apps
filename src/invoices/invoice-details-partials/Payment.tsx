import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { LabelValuePair } from '../../common/interfaces';
import { dateFormatter } from '../../common/formaters';
import { Invoice } from '../../common/models/invoice';
import { DisplayField } from '../../components/DisplayField';


interface PaymentProps {
  contacts: LabelValuePair[];
  invoice: Invoice;
  columnGap: string;
};

export class Payment extends React.Component<PaymentProps> {
  displayName = 'PaymentForm';

  render() {
    const {
      invoice,
      columnGap,
      contacts,
    } = this.props;


    const payeeName = contacts.filter(contact =>
      contact.value === invoice!.payee,
    ).map(contact => contact.label).shift();

    return (
      <Box gap={columnGap} flex="grow">
        <Box direction="row" gap={columnGap}>
          <Box basis={'1/4'}>
            <DisplayField
              label="Payee"
              value={payeeName}
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
              label="Gross amount"
              value={invoice!.gross_amount}
            />
          </Box>
          <Box basis={'1/4'}>
            <DisplayField
              label="Tax amount"
              value={invoice!.tax_amount}
            />
          </Box>
        </Box>
        <Box direction="row" gap={columnGap} flex="grow">

          <Box basis={'1/4'}>
            <DisplayField
              label="Currency"
              value={invoice!.currency}
            />
          </Box>
          <Box basis={'1/4'}>
            <DisplayField
              label="Due date"
              value={dateFormatter(invoice!.date_due)}
            />
          </Box>
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

        </Box>
      </Box>
    );

  }
}

