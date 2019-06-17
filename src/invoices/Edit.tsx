import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import InvoiceForm from './InvoiceForm';
import { getInvoiceById, resetGetInvoiceById, resetUpdateInvoice, updateInvoice } from '../store/actions/invoices';
import { Invoice } from '../common/models/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { InvoiceData, LabelValuePair } from '../common/interfaces';
import { Box, Button, Heading } from 'grommet';
import { invoiceRoutes } from './routes';
import { LinkPrevious } from 'grommet-icons';
import { User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { NotificationContext } from '../notifications/NotificationContext';
import { RequestState } from '../store/reducers/http-request-reducer';

type ConnectedEditInvoiceProps = {
  updateInvoice: (invoice: Invoice) => void;
  resetUpdateInvoice: () => void;
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice?: Invoice;
  contacts?: LabelValuePair[];
  loggedInUser: User;
  updatingInvoice: RequestState<InvoiceData>;
} & RouteComponentProps<{ id?: string }>;

class ConnectedEditInvoice extends React.Component<ConnectedEditInvoiceProps> {
  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
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
    const { loggedInUser, updatingInvoice } = this.props;

    if (!this.props.invoice || !this.props.contacts) {
      return <Preloader message="Loading"/>;
    }

    if (updatingInvoice.loading) {
      return <Preloader message="Updating invoice" withSound={true}/>;
    }

    // Add logged in user to contacts
    const contacts: LabelValuePair[] = [
      { label: loggedInUser.name, value: loggedInUser.account },
      ...this.props.contacts,
    ];

    return (
      <InvoiceForm
        onSubmit={this.updateInvoice}
        contacts={contacts}
        invoice={this.props.invoice}
      >
        <Box justify="between" direction="row" align="center">
          <Box direction="row" gap="small" align="center">
            <Link to={invoiceRoutes.index} size="large">
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

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    invoice: state.invoices.getById.data && {
      _id: state.invoices.getById.data._id,
      ...state.invoices.getById.data.data,
    },
    updatingInvoice: state.invoices.update,
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
  {
    updateInvoice,
    resetUpdateInvoice,
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
  },
)(withRouter(ConnectedEditInvoice));
