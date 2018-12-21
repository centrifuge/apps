import React from 'react';

import { connect } from 'react-redux';

import CreateInvoice from './CreateInvoice';
import { createInvoice } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../../reducers/http-request-reducer';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';
import { Contact } from '../../common/models/dto/contact';
import { getContacts } from '../../actions/contacts';
import { LabelValuePair } from '../../interfaces';

type ConnectedCreateInvoiceProps = {
  createInvoice: (invoice: Invoice) => void;
  getContacts: () => void;
  creatingInvoice: boolean;
  contactsLoading: boolean;
  contacts?: LabelValuePair[];
} & RouteComponentProps;

class ConnectedCreateInvoice extends React.Component<
  ConnectedCreateInvoiceProps
> {
  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
    }
  }

  createInvoice = (invoice: Invoice) => {
    this.props.createInvoice(invoice);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    if (this.props.creatingInvoice) {
      return 'Creating invoice';
    }

    if (this.props.contactsLoading || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <CreateInvoice
        onSubmit={this.createInvoice}
        onCancel={this.onCancel}
        contacts={this.props.contacts}
      />
    );
  }
}

export default connect(
  (state: {
    invoices: { create: RequestState<InvoiceInvoiceData> };
    contacts: { get: RequestState<Contact[]> };
  }) => {
    return {
      creatingInvoice: state.invoices.create.loading,
      contactsLoading: state.contacts.get.loading,
      contacts: state.contacts.get.data
        ? (state.contacts.get.data.map(contact => ({
            label: contact.name,
            value: contact._id,
          })) as LabelValuePair[])
        : undefined,
    };
  },
  { createInvoice, getContacts },
)(withRouter(ConnectedCreateInvoice));
