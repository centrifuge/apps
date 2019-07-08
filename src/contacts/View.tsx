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
import { Contact } from '../common/models/contact';
import ContactList from './ContactList';
import { Preloader } from '../components/Preloader';
import { User } from '../common/models/user';

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
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
  loggedInUser: User;
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

    const { loading, loggedInUser, contacts } = this.props;

    if (loading) {
      return <Preloader message="Loading"/>;
    }

    return (
      <ContactList
        loggedInUser={loggedInUser}
        contacts={contacts as Contact[]}
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
