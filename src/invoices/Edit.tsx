import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import InvoiceForm from './InvoiceForm';
import { getInvoiceById, resetGetInvoiceById, resetUpdateInvoice, updateInvoice } from '../store/actions/invoices';
import { Invoice } from '../common/models/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvInvoiceResponse } from '../../clients/centrifuge-node';
import { Contact } from '../common/models/contact';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import { Box, Button, Heading } from 'grommet';
import routes from './routes';
import { LinkPrevious } from 'grommet-icons';

type ConnectedEditInvoiceProps = {
  updateInvoice: (invoice: Invoice) => void;
  resetUpdateInvoice: () => void;
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice?: Invoice;
  contacts?: LabelValuePair[];
} & RouteComponentProps<{ id?: string }>;

class ConnectedEditInvoice extends React.Component<ConnectedEditInvoiceProps> {
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
    this.props.resetUpdateInvoice();
  }

  updateInvoice = (invoice: Invoice) => {
    this.props.updateInvoice(invoice);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    if (!this.props.invoice || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <InvoiceForm
        onSubmit={this.updateInvoice}
        contacts={this.props.contacts}
        invoice={this.props.invoice}
      >
        <Box justify="between" direction="row" align="center">
          <Box direction="row" gap="small" align="center">
            <Link to={routes.index} size="large">
              <LinkPrevious/>
            </Link>
            <Heading level="3">
              {'Update Invoice'}
            </Heading>
          </Box>

          <Box direction="row" gap="medium">
            <Button
              onClick={this.onCancel}
              label="Discard"
            />
            <Button
              type="submit"
              primary
              label="Update"
            />
          </Box>
        </Box>
      </InvoiceForm>
    );
  }
}

export default connect(
  (state: {
    invoices: {
      getById: RequestState<InvInvoiceResponse & { _id: string }>;
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
    updateInvoice,
    resetUpdateInvoice,
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
  },
)(withRouter(ConnectedEditInvoice));
