import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { InvoiceData, InvoiceResponse, LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { RequestState } from '../store/reducers/http-request-reducer';
import { DocumentResponseHeader, FunFundingResponseData } from '../../clients/centrifuge-node';
import { Contact } from '../common/models/contact';
import { getInvoiceById, resetGetInvoiceById } from '../store/actions/invoices';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { DisplayField } from '../components/DisplayField';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { Sender } from './invoice-details-partials/Sender';
import { Recipient } from './invoice-details-partials/Recipient';
import { ShipTo } from './invoice-details-partials/ShipTo';
import { RemitTo } from './invoice-details-partials/RemitTo';
import { Details } from './invoice-details-partials/Details';
import { CreditNote } from './invoice-details-partials/CreditNote';
import { invoiceRoutes } from './routes';
import { Section } from '../components/Section';
import { InvoiceTotal } from './invoice-details-partials/InvoiceTotal';
import { Modal } from '@centrifuge/axis-modal';
import FundingRequestForm from './FundingRequestForm';
import { FundingRequest } from '../common/models/funding-request';
import { dateFormatter } from '../common/formaters';
import { createFunding, resetCreateFunding } from '../store/actions/funding';
import { FundingAgreement } from './invoice-details-partials/FundingAgreement';
import { InvoiceDetails } from './InvoiceDetails';

type ConnectedFundingAgreementViewProps = {
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  createFunding: (fundingRequest: FundingRequest) => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice: InvoiceData | null;
  header: DocumentResponseHeader | null,
  fundingAgreement: FunFundingResponseData | null,
  id: string | null,
  contacts?: LabelValuePair[];
} & RouteComponentProps<{ id?: string }>;

export class FundingAgreementView extends React.Component<ConnectedFundingAgreementViewProps> {

  displayName = 'FundingAgreementView';

  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
      this.props.getInvoiceById(this.props.match.params.id);
    }
  }

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
  }

  render() {
    const { invoice, contacts, fundingAgreement } = this.props;
    if (!invoice || !contacts) {
      return <Box align="center" justify="center" fill={true}>Loading Funding Agreement</Box>;
    }
    const canApproveFunding = false;

    return (
      <>

        <Box pad={{ bottom: 'large' }}>
          <Box justify="between" direction="row" align="center">
            <Box direction="row" gap="small" align="center">
              <Link to={routes.invoices.index} size="large">
                <LinkPrevious/>
              </Link>

              <Heading level="3">
                Funding Agreement for Invoice #{invoice!.number}
              </Heading>
            </Box>
            <Box direction="row" gap="medium">
              <Button
                disabled={!canApproveFunding}
                primary
                label="Approve"
              />
            </Box>
          </Box>

         <InvoiceDetails invoice={invoice} fundingAgreement={fundingAgreement} contacts={contacts}/>
        </Box>
      </>
    );

  }
}


const mapStateToProps = (state) => {
  return {
    ...(!state.invoices.getById.data ? {
      invoice: null,
      header: null,
      fundingAgreement: null,
      id: null,
    } : {
      invoice: state.invoices.getById.data.data,
      id: state.invoices.getById.data._id,
      fundingAgreement: state.invoices.getById.data.fundingAgreement,
      header: state.invoices.getById.data.header,
    }),
    contacts: state.contacts.get.data
      ? (state.contacts.get.data.map(contact => ({
        label: contact.name,
        value: contact.address,
      })) as LabelValuePair[])
      : undefined,
  };
};

export const ConnectedFundingAgreementView = connect(
  mapStateToProps,
  {
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
  },
)(withRouter(FundingAgreementView));


