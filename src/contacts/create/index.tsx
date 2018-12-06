import React from 'react';

import { connect } from 'react-redux';

import { createContact } from '../../actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../../reducers/http-request-reducer';
import { Contact } from '../../common/models/dto/contact';
import CreateContact from './CreateContact';
import routes from '../routes';

type ConnectedCreateContactProps = {
  createContact: (contact: Contact) => void;
  loading: boolean;
} & RouteComponentProps;

class ConnectedCreateContact extends React.Component<
  ConnectedCreateContactProps
> {
  static displayName = 'ConnectedCreateContact';

  createContact = (contact: Contact) => {
    this.props.createContact(contact);
  };

  onCancel = () => {
    this.props.history.push(routes.index);
  };

  render() {
    if (this.props.loading) {
      return 'Creating contact';
    }

    return (
      <CreateContact onSubmit={this.createContact} onCancel={this.onCancel} />
    );
  }
}

export default connect(
  (state: { contacts: { create: RequestState<Contact> } }) => {
    return {
      loading: state.contacts.create.loading,
    };
  },
  { createContact },
)(withRouter(ConnectedCreateContact));
