import React from 'react';

import { connect } from 'react-redux';

import InvoiceForm from './InvoiceForm';
import {
  getInvoiceById,
  resetGetInvoiceById,
  resetUpdateInvoice,
  updateInvoice,
} from '../store/actions/invoices';
import { Invoice } from '../common/models/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvoiceInvoiceResponse } from '../../clients/centrifuge-node';
import { Contact } from '../common/models/contact';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';

type ConnectedEditInvoiceProps = {
  updateInvoice: (invoice: Invoice) => void;
  resetUpdateInvoice: () => void;
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
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
    if (this.props.invoiceLoading) {
      return 'Loading invoice';
    }

    if (this.props.contactsLoading || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <InvoiceForm
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
  {
    updateInvoice,
    resetUpdateInvoice,
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
  },
)(withRouter(ConnectedEditInvoice));
