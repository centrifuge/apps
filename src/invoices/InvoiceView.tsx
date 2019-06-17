import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { DocumentResponseHeader, FunFundingResponse, FunFundingResponseData } from '../../clients/centrifuge-node';
import { getInvoiceById, resetGetInvoiceById } from '../store/actions/invoices';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { invoiceRoutes } from './routes';
import { Modal } from '@centrifuge/axis-modal';
import FundingRequestForm from './FundingRequestForm';
import { FundingRequest } from '../common/models/funding-request';
import { dateToString } from '../common/formaters';
import { createFunding, resetCreateFunding } from '../store/actions/funding';
import { InvoiceDetails } from './InvoiceDetails';
import { RequestState } from '../store/reducers/http-request-reducer';
import { Invoice } from '../common/models/invoice';
import { Preloader } from '../components/Preloader';
import { NotificationContext } from '../notifications/NotificationContext';

type ConnectedInvoiceViewProps = {
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  resetCreateFunding: () => void;
  createFunding: (fundingRequest: FundingRequest) => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice: Invoice | null;
  header: DocumentResponseHeader | null,
  fundingAgreement: FunFundingResponseData | null,
  id: string | null,
  contacts?: LabelValuePair[];
  creatingFunding: RequestState<FunFundingResponse>;
} & RouteComponentProps<{ id?: string }>;

export class InvoiceView extends React.Component<ConnectedInvoiceViewProps> {

  displayName = 'InvoiceView';
  state = {
    requestFunding: false,
  };

  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
      this.props.getInvoiceById(this.props.match.params.id);
    }
  }


  closeFundingRequest = () => {
    this.setState({ requestFunding: false });
  };

  openFundingRequest = () => {
    this.setState({ requestFunding: true });
  };

  submitFundingRequest = (fundingRequest: FundingRequest) => {
    this.closeFundingRequest();
    this.props.createFunding(fundingRequest);
  };

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
    this.props.resetCreateFunding();
  }

  render() {
    const { id, header, invoice, contacts, fundingAgreement, creatingFunding } = this.props;
    const { requestFunding } = this.state;
    const fundingRequest: FundingRequest = new FundingRequest();


    if (!invoice || !contacts) {
      return <Preloader message="Loading"/>;
    }

    if (creatingFunding && creatingFunding.loading) {
      return <Preloader message="Requesting funding agreement" withSound={true}/>;
    }

    // TODO make currency and due_date mandatory in invoice
    //@ts-ignore
    fundingRequest.invoice_id = id;
    //@ts-ignore
    fundingRequest.currency = invoice.currency;
    //@ts-ignore
    fundingRequest.document_id = header.document_id;
    //@ts-ignore
    fundingRequest.repayment_due_date = invoice.date_due || dateToString(new Date());

    // We can fund invoices only that have date due greated then today
    // and have the status unpaid
    const canRequestFunding = !fundingAgreement
      //@ts-ignore
      && (new Date(invoice.date_due)) > (new Date())
      && invoice.status === 'unpaid'
      && invoice.currency
      && invoice.date_due;


    return (
      <>
        <Modal
          opened={requestFunding}
          headingProps={{ level: 3 }}
          title={`Request funding for invoice #${invoice.number}`}
          onClose={this.closeFundingRequest}
        >
          <FundingRequestForm
            maxAmount={parseFloat(invoice.gross_amount || '')}
            onSubmit={this.submitFundingRequest}
            onDiscard={this.closeFundingRequest}
            contacts={contacts}
            fundingRequest={fundingRequest}
          />
        </Modal>
        <Box pad={{ bottom: 'large' }}>
          <Box justify="between" direction="row" align="center">
            <Box direction="row" gap="small" align="center">
              <Link to={routes.invoices.index} size="large">
                <LinkPrevious/>
              </Link>

              <Heading level="3">
                Invoice #{invoice!.number}
              </Heading>
            </Box>
            <Box direction="row" gap="medium">
              <Button
                disabled={!canRequestFunding}
                onClick={() => {
                  id && this.props.history.push(
                    invoiceRoutes.edit.replace(':id', id),
                  );
                }}
                label="Edit"
              />
              <Button
                disabled={!canRequestFunding}
                primary
                onClick={this.openFundingRequest}
                label="Request Funding"
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

    creatingFunding: state.funding.create,
    contacts: state.contacts.get.data
      ? (state.contacts.get.data.map(contact => ({
        label: contact.name,
        value: contact.address,
      })) as LabelValuePair[])
      : undefined,
  };
};

export const ConnectedInvoiceView = connect(
  mapStateToProps,
  {
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
    createFunding,
    resetCreateFunding,
  },
)(withRouter(InvoiceView));


