import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { Section } from '@centrifuge/axis-section';
import { Invoice } from '../common/models/invoice';
import { LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvoiceInvoiceResponse } from '../../clients/centrifuge-node';
import { Contact } from '../common/models/contact';
import { getInvoiceById, resetGetInvoiceById } from '../store/actions/invoices';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { DisplayField } from '../components/DisplayField';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { Sender } from './invoice-details-partials/Sender';
import { Recipient } from './invoice-details-partials/Recipient';
import { ShipTo } from './invoice-details-partials/ShipTo';
import { RemitTo } from './invoice-details-partials/RemitTo';
import { Payment } from './invoice-details-partials/Payment';
import { CreditNote } from './invoice-details-partials/CreditNote';
import invoiceRoutes from './routes';

type ConnectedInvoiceDetailsProps = {
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice?: Invoice;
  contacts?: LabelValuePair[];
} & RouteComponentProps<{ id?: string }>;

export class InvoiceDetails extends React.Component<ConnectedInvoiceDetailsProps> {
  displayName = 'InvoiceDetails';

  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
    }

    if (this.props.match.params.id) {
      this.props.getInvoiceById(this.props.match.params.id);
    }
  }

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
  }

  render() {

    const { invoice, contacts } = this.props;
    const columnGap = 'medium';
    const sectionGap = 'xlarge';

    if (!invoice || !contacts) {
      return 'Loading invoice';
    }

    return (
      <Box pad={{ bottom: 'large' }}>
        <Box justify="between" direction="row" align="center">
          <Box direction="row" gap="small" align="center">
            <Link to={routes.invoices.index} size="large">
              <LinkPrevious/>
            </Link>

            <Heading level="3">
              Invoice #{invoice!.number}
            </Heading>
          </Box>
          <Box direction="row" gap="medium">
            <Button
              active={false}
              onClick={() => {
                invoice._id && this.props.history.push(
                  invoiceRoutes.edit.replace(':id', invoice._id),
                );
              }}
              label="Edit"
            />
            <Button
              primary
              label="Request Funding"
            />
          </Box>
        </Box>

        <Box>
          <Box direction="column" gap={sectionGap}>
            <Box>
              {/* Invoice number section */}
              <Box>
                <DisplayField
                  label="Invoice number"
                  value={invoice!.number}
                />
              </Box>
            </Box>

            {/*Sender and Recipient */}
            <Box direction="row" gap={columnGap}>
              <Sender
                invoice={invoice}
                columnGap={columnGap}
                contacts={contacts}
              />
              <Recipient
                invoice={invoice}
                columnGap={columnGap}
                contacts={contacts}
              />
            </Box>

            {/*Ship to and Remit to */}
            <Box direction="row" gap={columnGap}>
              <ShipTo
                invoice={invoice}
                columnGap={columnGap}
              />
              <RemitTo
                invoice={invoice}
                columnGap={columnGap}
              />
            </Box>

            {/* Payment section */}
            <Box gap={columnGap}>
              <Payment
                invoice={invoice}
                columnGap={columnGap}
                contacts={contacts}
              />
            </Box>

            {/* Credit note section */}
            <Box direction="row" gap={columnGap}>
              <CreditNote
                invoice={invoice}
                columnGap={columnGap}
              />
            </Box>

            {/* Comments section */}
            <Box>
              <DisplayField
                label="Comments"
                value={invoice!.comment}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );

  }
}

export const ConnectedInvoiceDetails = connect(
  (state: {
    invoices: {
      getById: RequestState<InvoiceInvoiceResponse & { _id: string }>;
    };
    contacts: { get: RequestState<Contact[]> };
  }) => {
    return {
      invoice: state.invoices.getById.data && {
        _id: state.invoices.getById.data._id,
        ...state.invoices.getById.data.data,
      },
      contacts: state.contacts.get.data
        ? (state.contacts.get.data.map(contact => ({
          label: contact.name,
          value: contact.address,
        })) as LabelValuePair[])
        : undefined,
    };
  },
  {
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
  },
)(withRouter(InvoiceDetails));


