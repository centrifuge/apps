import React from 'react';
import { Box } from 'grommet';
import { InvoiceResponse, LabelValuePair } from '../common/interfaces';
import { DisplayField } from '../components/DisplayField';
import { Sender } from './invoice-details-partials/Sender';
import { Recipient } from './invoice-details-partials/Recipient';
import { Details } from './invoice-details-partials/Details';
import { Section } from '../components/Section';
import { FundingAgreement } from './invoice-details-partials/FundingAgreement';
import { TransferDetail } from './invoice-details-partials/TransferDetail';

type ConnectedInvoiceDetailsProps = {
  invoice: InvoiceResponse;
  fundingStatus: string,
  contacts: LabelValuePair[];
}

export class InvoiceDetails extends React.Component<ConnectedInvoiceDetailsProps> {

  displayName = 'InvoiceDetails';

  render() {
    const {
      invoice,
      contacts,

      fundingStatus,
    } = this.props;

    const columnGap = 'medium';
    const sectionGap = 'none';

    const invoiceData = invoice.data || { currency: 'USD' };
    const transferDetails = invoice.transferDetails || [];
    const fundingAgreement = invoice.fundingAgreement;
    const fundingTransfer = transferDetails[0];
    const repaymentTransfer = transferDetails[1];

    return (
      <Box>
        <Box direction="column" gap={sectionGap}>
          <Section>
            {/* Invoice number section */}
            <Box direction={'row'}>
              <Box basis={'1/2'}>
                <DisplayField
                  label="Invoice number"
                  value={invoiceData!.number}
                />
              </Box>
            </Box>
          </Section>

          {/*Funding Agreement*/}

          {fundingAgreement &&
          <FundingAgreement fundingStatus={fundingStatus} fundingAgreement={fundingAgreement} columnGap={columnGap}/>}
          {fundingTransfer &&
          <TransferDetail transfer={fundingTransfer} title={'Funding Transfer'} columnGap={columnGap}/>}
          {repaymentTransfer &&
          <TransferDetail transfer={repaymentTransfer} title={'Repayment Transfer'} columnGap={columnGap}/>}

          {/*Sender and Recipient */}
          <Box direction="row" gap={columnGap}>
            <Sender
              invoice={invoiceData}
              columnGap={columnGap}
              contacts={contacts}
            />
            <Recipient
              invoice={invoiceData}
              columnGap={columnGap}
              contacts={contacts}
            />
          </Box>


          {/* Details section */}
          <Box gap={columnGap}>
            <Details
              invoice={invoiceData}
              columnGap={columnGap}
            />
          </Box>


          {/*Ship to and Remit to */}
          {/*<Box direction="row" gap={columnGap}>
            <ShipTo
              invoice={invoice}
              columnGap={columnGap}
            />
            <RemitTo
              invoice={invoice}
              columnGap={columnGap}
            />
          </Box>*/}

          {/* Credit note section */}
          {/*<Box direction="row" gap={columnGap}>
            <CreditNote
              invoice={invoice}
              columnGap={columnGap}
            />
          </Box>*/}

          {/* Comments section */}
          <Box direction="row">
            <Section headingLevel="5" title="Comments" basis={'1/2'}>
              <DisplayField
                value={invoiceData!.comment}
              />
            </Section>

          </Box>
        </Box>
      </Box>
    );

  }
}
