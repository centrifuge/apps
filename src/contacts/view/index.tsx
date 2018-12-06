import React from 'react';

import { connect } from 'react-redux';

import { getContacts } from '../../actions/contacts';
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

    return <Contacts contacts={this.props.contacts as Contact[]} />;
  }
}

export default connect(
  mapStateToProps,
  { getContacts },
)(ViewContacts);
