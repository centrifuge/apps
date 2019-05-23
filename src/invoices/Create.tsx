import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import InvoiceForm from './InvoiceForm';
import { createInvoice, resetCreateInvoice } from '../store/actions/invoices';
import { Invoice } from '../common/models/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import routes from './routes';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { User } from '../common/models/user';

type ConnectedCreateInvoiceProps = {
  createInvoice: (invoice: Invoice) => void;
  resetCreateInvoice: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  creatingInvoice: boolean;
  contacts?: LabelValuePair[];
  loggedInUser: User;
} & RouteComponentProps;

class ConnectedCreateInvoice extends React.Component<ConnectedCreateInvoiceProps> {

  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
    }
  }

  componentWillUnmount() {
    this.props.resetCreateInvoice();
    this.props.resetGetContacts();
  }

  createInvoice = (invoice: Invoice) => {
    this.props.createInvoice(invoice);
  };

  onCancel = () => {
    this.props.history.push(routes.index);
  };

  render() {

    const { loggedInUser } = this.props;

    if (!this.props.contacts) {
      return <Box align="center" justify="center" fill={true}>Loading</Box>;
    }

    if (this.props.creatingInvoice) {
      return <Box align="center" justify="center" fill={true}>Creating Invoice</Box>;
    }
    // Add logged in user to contacts
    const contacts: LabelValuePair[] = [
      { label: loggedInUser.name, value: loggedInUser.account },
      ...this.props.contacts
    ];

    // Create default data for invoice. The sender should be the logged in user
    const defaultInvoice: Invoice = {
      sender: loggedInUser.account,
      sender_company_name: loggedInUser.name,
      currency: 'USD',
    };

    return (
      <InvoiceForm
        invoice={defaultInvoice}
        onSubmit={this.createInvoice}
        contacts={contacts}
      >
        <Box justify="between" direction="row" align="center">
          <Box direction="row" gap="small" align="center">
            <Link to={routes.index} size="large">
              <LinkPrevious/>
            </Link>
            <Heading level="3">
              {'New Invoice'}
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
              label="Send"
            />
          </Box>
        </Box>
      </InvoiceForm>
    );
  }
}


const mapStateToProps = (state) => {
  console.log('here')
  return {
    loggedInUser: state.user.auth.loggedInUser,
    creatingInvoice: state.invoices.create.loading,
    contacts: state.contacts.get.data
      ? (state.contacts.get.data.map(contact => ({
        label: contact.name,
        value: contact.address,
      })) as LabelValuePair[])
      : undefined,
  };
};

export default connect(
  mapStateToProps,
  { createInvoice, resetCreateInvoice, getContacts, resetGetContacts },
)(withRouter(ConnectedCreateInvoice));


