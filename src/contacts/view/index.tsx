import React from 'react';

import { connect } from 'react-redux';

import {
  createContact,
  getContacts,
  updateContact,
} from '../../actions/contacts';
import { RequestState } from '../../reducers/http-request-reducer';
import { Contact } from '../../common/models/dto/contact';
import Contacts from './Contacts';

const mapStateToProps = (state: {
  contacts: { get: RequestState<Contact[]> };
}) => {
  return {
    contacts: state.contacts.get.data,
    loading: state.contacts.get.loading,
  };
};

type ViewContactsProps = {
  getContacts: () => void;
  createContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  contacts?: Contact[];
  loading: boolean;
};

class ViewContacts extends React.Component<ViewContactsProps> {
  componentDidMount() {
    this.props.getContacts();
  }

  render() {
    if (this.props.loading) {
      return 'Loading';
    }

    return (
      <Contacts
        contacts={this.props.contacts as Contact[]}
        refresh={this.props.getContacts}
        createContact={this.props.createContact}
        updateContact={this.props.updateContact}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  { getContacts, createContact, updateContact },
)(ViewContacts);
