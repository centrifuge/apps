import React from 'react';

import { connect } from 'react-redux';

import {
  createContact,
  getContacts,
  resetCreateContact,
  resetGetContacts,
  resetUpdateContact,
  updateContact,
} from '../store/actions/contacts';
import { RequestState } from '../store/reducers/http-request-reducer';
import { Contact } from '../common/models/contact';
import ContactList from './ContactList';
import { Preloader } from '../components/Preloader';

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
  resetCreateContact: () => void;
  createContact: (contact: Contact) => void;
  resetGetContacts: () => void;
  updateContact: (contact: Contact) => void;
  resetUpdateContact: () => void;
  contacts?: Contact[];
  loading: boolean;
};

class ViewContacts extends React.Component<ViewContactsProps> {
  componentDidMount() {
    this.props.getContacts();
  }

  componentWillUnmount() {
    this.props.resetCreateContact();
    this.props.resetGetContacts();
    this.props.resetUpdateContact();
  }

  render() {
    if (this.props.loading) {
      return <Preloader message="Loading"/>;
    }

    return (
      <ContactList
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
  {
    getContacts,
    resetGetContacts,
    createContact,
    resetCreateContact,
    updateContact,
    resetUpdateContact,
  },
)(ViewContacts);
