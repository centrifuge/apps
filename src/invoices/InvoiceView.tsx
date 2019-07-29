import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { InvoiceResponse, LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { FunFundingResponse } from '../../clients/centrifuge-node';
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
import { Preloader } from '../components/Preloader';
import { createTransferDetails, updateTransferDetails } from '../store/actions/transfer-details';
import TransferDetailsForm from './TransferDetailsForm';
import { getInvoiceFundingStatus, FUNDING_STATUS, TRANSFER_DETAILS_STATUS } from '../common/status';
import { TransferDetailsRequest } from '../common/models/transfer-details';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { mapContactsToLabelKeyPair } from '../store/derived-data';


type ConnectedInvoiceViewProps = {
  getInvoiceById: (id: string) => void;
  resetGetInvoiceById: () => void;
  resetCreateFunding: () => void;
  createFunding: (fundingRequest: FundingRequest) => void;
  createTransferDetails: typeof createTransferDetails;
  updateTransferDetails: typeof updateTransferDetails;
  getContacts: () => void;
  resetGetContacts: () => void;
  invoice: InvoiceResponse | null;
  transferDetails: any | null,
  id: string | null,
  contacts?: LabelValuePair[];
  creatingFunding: RequestState<FunFundingResponse>;
  creatingTransferDetails: RequestState<TransferDetailsRequest>;
  updatingTransferDetails: RequestState<TransferDetailsRequest>;
} & RouteComponentProps<{ id?: string }>;

export class InvoiceView extends React.Component<ConnectedInvoiceViewProps> {

  displayName = 'InvoiceView';
  state = {
    requestFunding: false,
    addTransferDetails: false,
  };

  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
      this.props.getInvoiceById(this.props.match.params.id);
    }
  }

  openTransferDetails = () => {
    this.setState({ addTransferDetails: true });
  };

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

  closeTransferDetails = () => {
    this.setState({ addTransferDetails: false });
  };

  submitTransferDetails = (transferDetails) => {
    this.closeTransferDetails();
    const { createTransferDetails } = this.props;
    createTransferDetails(transferDetails);
  };

  confirmFunding = () => {
    const { updateTransferDetails, invoice } = this.props;

    const fundingTransfer = {
      ...invoice!.transferDetails![0],
      document_id: invoice!.header!.document_id,
      invoice_id: invoice!._id,
      status: TRANSFER_DETAILS_STATUS.SETTLED,
      settlement_date: dateToString(new Date()),
    };


    updateTransferDetails(fundingTransfer);
  };

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
    this.props.resetCreateFunding();
  }

  render() {
    const {
      invoice,
      contacts,
      creatingFunding,
      creatingTransferDetails,
      updatingTransferDetails,

    } = this.props;
    const { requestFunding, addTransferDetails } = this.state;

    if (!invoice || !contacts || !invoice.data) {
      return <Preloader message="Loading"/>;
    }

    if (creatingFunding && creatingFunding.loading) {
      return <Preloader message="Requesting funding agreement" />;
    }

    if (updatingTransferDetails && updatingTransferDetails.loading) {
      return <Preloader message="Confirming funding" />;
    }

    if (creatingTransferDetails && creatingTransferDetails.loading) {
      return <Preloader message="Recording repayment transfer" />;
    }

    const {
      _id,
      header,
      data,
      fundingAgreement,
    } = invoice;

    const fundingStatus = getInvoiceFundingStatus(invoice);
    const fundingRequest: FundingRequest = new FundingRequest();

    const repaymentDetails = fundingAgreement ? {
      invoice_id: invoice!._id,
      document_id: header!.document_id,
      currency: 'DAI',
      sender_id: fundingAgreement!.funding!.funder_id,
      recipient_id: invoice!.data!.sender,
      amount: 0,
      transfer_type: 'crypto',
      status: TRANSFER_DETAILS_STATUS.OPENED,
    } : {};

    //@ts-ignore
    fundingRequest.invoice_id = _id;
    //@ts-ignore
    fundingRequest.currency = data.currency;
    //@ts-ignore
    fundingRequest.document_id = header.document_id;
    fundingRequest.invoice_amount = parseFloat(data.gross_amount || '');
    //@ts-ignore
    fundingRequest.repayment_due_date = data.date_due || dateToString(new Date());

    // We can fund invoices only that have date due created later than today
    // and have the status unpaid
    const canRequestFunding = !fundingAgreement
      //@ts-ignore
      && (new Date(data.date_due)) > (new Date())
      && data.status === 'unpaid'
      && data.currency
      && data.date_due;


    const canSettleFunding = fundingStatus === FUNDING_STATUS.SENDING_FUNDING;
    const canRecordPayment = fundingStatus === FUNDING_STATUS.FUNDED;


    return (
      <>
        <Modal
          opened={addTransferDetails}
          headingProps={{ level: 3 }}
          title={`Record repayment`}
          onClose={this.closeTransferDetails}
        >
          <TransferDetailsForm
            onSubmit={this.submitTransferDetails}
            onDiscard={this.closeTransferDetails}
            contacts={contacts}
            transferDetails={repaymentDetails}
          />
        </Modal>
        <Modal
          opened={requestFunding}
          headingProps={{ level: 3 }}
          title={`Request funding for invoice #${data.number}`}
          onClose={this.closeFundingRequest}
        >
          <FundingRequestForm
            onSubmit={this.submitFundingRequest}
            onDiscard={this.closeFundingRequest}
            contacts={contacts}
            fundingRequest={fundingRequest}
          />
        </Modal>
        <Box pad={{ bottom: 'large' }}>
          <SecondaryHeader>
            <Box direction="row" gap="small" align="center">
              <Link to={routes.invoices.index} size="large">
                <LinkPrevious/>
              </Link>

              <Heading level="3">
                Invoice #{invoice!.data!.number}
              </Heading>
            </Box>
            <Box direction="row" gap="medium">
              {
                canRequestFunding && <Button
                  onClick={() => {
                    _id && this.props.history.push(
                      invoiceRoutes.edit.replace(':id', _id),
                    );
                  }}
                  label="Edit"
                />
              }
              {
                canRequestFunding && <Button
                  disabled={!canRequestFunding}
                  primary
                  onClick={this.openFundingRequest}
                  label="Request funding"
                />
              }
              {
                canRecordPayment && <Button
                  primary
                  label="Record repayment transfer"
                  onClick={this.openTransferDetails}
                />
              }
              {
                canSettleFunding && <Button
                  primary
                  label="Confirm funding transfer"
                  onClick={this.confirmFunding}
                />
              }
            </Box>
          </SecondaryHeader>

          <InvoiceDetails
            invoice={invoice}
            fundingStatus={fundingStatus}
            contacts={contacts}/>
        </Box>
      </>
    );

  }
}


const mapStateToProps = (state) => {
  return {
    invoice: state.invoices.getById.data,
    creatingTransferDetails: state.transferDetails.create,
    updatingTransferDetails: state.transferDetails.update,
    creatingFunding: state.funding.create,
    contacts: mapContactsToLabelKeyPair(state),
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
    createTransferDetails,
    updateTransferDetails,
  },
)(withRouter(InvoiceView));


