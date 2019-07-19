import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import InvoiceForm from './InvoiceForm';
import { createInvoice, resetCreateInvoice } from '../store/actions/invoices';
import { Invoice } from '../common/models/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import { invoiceRoutes } from './routes';
import { Box, Button, Heading } from 'grommet';
import { LinkPrevious } from 'grommet-icons';
import { User } from '../common/models/user';
import { Preloader } from '../components/Preloader';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvoiceData } from '../../clients/centrifuge-node';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { mapContactsToLabelKeyPair } from '../store/derived-data';

type ConnectedCreateInvoiceProps = {
  createInvoice: (invoice: Invoice) => void;
  resetCreateInvoice: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  creatingInvoice: RequestState<InvoiceData>;
  contacts?: LabelValuePair[];
  loggedInUser: User;
} & RouteComponentProps;


type ConnectedCreateInvoiceState = {
  defaultInvoice: Invoice
}

class ConnectedCreateInvoice extends React.Component<ConnectedCreateInvoiceProps, ConnectedCreateInvoiceState> {

  constructor(props) {
    super(props);
    const { loggedInUser } = props;
    this.state = {
      defaultInvoice: {
        sender: loggedInUser.account,
        net_amount: '0',
        tax_rate: '0',
        status: 'unpaid',
        sender_company_name: loggedInUser.name,
        currency: 'USD',
      },
    };
  }

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
    this.setState({
      defaultInvoice: invoice,
    });
  };

  onCancel = () => {
    this.props.history.push(invoiceRoutes.index);
  };

  render() {

    const { creatingInvoice, contacts } = this.props;

    if (!this.props.contacts) {
      return <Preloader message="Loading"/>;
    }

    if (creatingInvoice.loading) {
      return <Preloader message="Saving invoice" withSound={true}/>;
    }


    // Create default data for invoice. The sender should be the logged in user


    return (
      <InvoiceForm
        invoice={this.state.defaultInvoice}
        onSubmit={this.createInvoice}
        contacts={contacts}
      >
        <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <Link to={invoiceRoutes.index} size="large">
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
              label="Save"
            />
          </Box>
        </SecondaryHeader>
      </InvoiceForm>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    loggedInUser: state.user.auth.loggedInUser,
    creatingInvoice: state.invoices.create,
    contacts: mapContactsToLabelKeyPair(state),
  };
};

export default connect(
  mapStateToProps,
  {
    createInvoice,
    resetCreateInvoice,
    getContacts,
    resetGetContacts,
  },
)(withRouter(ConnectedCreateInvoice));


