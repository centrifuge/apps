import React from 'react';

import { connect } from 'react-redux';

import CreateEditInvoice from '../CreateEditInvoice';
import { getInvoiceById, updateInvoice } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../../reducers/http-request-reducer';
import { InvoiceInvoiceResponse } from '../../../clients/centrifuge-node/generated-client';
import { Contact } from '../../common/models/dto/contact';
import { getContacts } from '../../actions/contacts';
import { LabelValuePair } from '../../interfaces';

type ConnectedEditInvoiceProps = {
  updateInvoice: (invoice: Invoice) => void;
  getInvoiceById: (id: string) => void;
  getContacts: () => void;
  invoiceLoading: boolean;
  contactsLoading: boolean;
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

  updateInvoice = (invoice: Invoice) => {
    this.props.updateInvoice(invoice);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    if (this.props.invoiceLoading) {
      return 'Loading invoice';
    }

    if (this.props.contactsLoading || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <CreateEditInvoice
        onSubmit={this.updateInvoice}
        onCancel={this.onCancel}
        contacts={this.props.contacts}
        invoice={this.props.invoice}
      />
    );
  }
}

export default connect(
  (state: {
    invoices: {
      getById: RequestState<InvoiceInvoiceResponse & { _id: string }>;
    };
    contacts: { get: RequestState<Contact[]> };
  }) => {
    return {
      invoiceLoading: state.invoices.getById.loading,
      invoice: state.invoices.getById.data && {
        _id: state.invoices.getById.data._id,
        ...state.invoices.getById.data.data,
        collaborators: state.invoices.getById.data.header!.collaborators,
      },
      contactsLoading: state.contacts.get.loading,
      contacts: state.contacts.get.data
        ? (state.contacts.get.data.map(contact => ({
            label: contact.name,
            value: contact.address,
          })) as LabelValuePair[])
        : undefined,
    };
  },
  { updateInvoice, getContacts, getInvoiceById },
)(withRouter(ConnectedEditInvoice));
