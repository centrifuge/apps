import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { InvoiceResponse, LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { RequestState } from '../store/reducers/http-request-reducer';
import { CoreapiTransferNFTResponse, FunFundingResponse } from '../../clients/centrifuge-node';
import { getInvoiceById, resetGetInvoiceById } from '../store/actions/invoices';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { settleFunding, signFunding } from '../store/actions/funding';
import { InvoiceDetails } from './InvoiceDetails';
import { Preloader } from '../components/Preloader';
import { Modal } from '@centrifuge/axis-modal';
import TransferDetailsForm from './TransferDetailsForm';
import { createTransferDetails, updateTransferDetails } from '../store/actions/transfer-details';
import { dateToString } from '../common/formaters';
import { FUNDING_STATUS, getInvoiceFundingStatus, TRANSFER_DETAILS_STATUS } from '../common/status';
import { TransferDetailsRequest } from '../common/models/transfer-details';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { mapContactsToLabelKeyPair } from '../store/derived-data';

type ConnectedFundingAgreementViewProps = {
  getInvoiceById: typeof getInvoiceById;
  resetGetInvoiceById: typeof resetGetInvoiceById;
  getContacts: typeof getContacts;
  signFunding: typeof signFunding;
  resetGetContacts: typeof resetGetInvoiceById;
  createTransferDetails: typeof createTransferDetails;
  settleFunding: typeof settleFunding;
  invoice: InvoiceResponse | null;
  contacts?: LabelValuePair[];
  signingFunding: RequestState<FunFundingResponse>;
  creatingTransferDetails: RequestState<TransferDetailsRequest>;
  settlingFunding: RequestState<CoreapiTransferNFTResponse>;
} & RouteComponentProps<{ id?: string }>;

export class FundingAgreementView extends React.Component<ConnectedFundingAgreementViewProps> {

  displayName = 'FundingAgreementView';

  state = {
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

  closeTransferDetails = () => {
    this.setState({ addTransferDetails: false });
  };

  submitTransferDetails = (transferDetails) => {
    this.closeTransferDetails();
    const { createTransferDetails } = this.props;
    createTransferDetails(transferDetails);
  };

  settleFundingAgreement = () => {
    const { invoice, settleFunding } = this.props;
    const repaymentTransfer = {
      ...invoice!.transferDetails![1],
      invoice_id: invoice!._id,
      agreement_id: invoice!.fundingAgreement!.funding!.agreement_id,
      document_id: invoice!.header!.document_id,
      status: TRANSFER_DETAILS_STATUS.SETTLED,
      settlement_date: dateToString(new Date()),
    };
    settleFunding(repaymentTransfer);
  };

  signFundingAgreement = () => {
    const { invoice, signFunding } = this.props;
    signFunding({
      document_id: invoice!.header!.document_id,
      agreement_id: invoice!.fundingAgreement!.funding!.agreement_id,
      invoice_id: invoice!._id!,
    });
  };

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
  }

  render() {
    const {
      invoice,
      contacts,
      signingFunding,
      creatingTransferDetails,
      settlingFunding,
    } = this.props;

    const { addTransferDetails } = this.state;


    if (!invoice || !invoice.data || !contacts) {
      return <Preloader message="Loading"/>;
    }

    if (signingFunding && signingFunding.loading) {
      return <Preloader message="Approving funding agreement" withSound={true}/>;
    }

    if (creatingTransferDetails && creatingTransferDetails.loading) {
      return <Preloader message="Recording funding transfer" withSound={true}/>;
    }

    if (settlingFunding && settlingFunding.loading) {
      return <Preloader message="Confirming repayment" withSound={true}/>;
    }

    const {
      header,
      fundingAgreement,
    } = invoice;

    const fundingStatus = getInvoiceFundingStatus(invoice);

    const fundingDetails = fundingAgreement ? {
      invoice_id: invoice!._id,
      document_id: header && header!.document_id,
      currency: 'DAI',
      sender_id: fundingAgreement!.funding!.funder_id || '',
      recipient_id: invoice!.data!.sender,
      amount: 0,
      transfer_type: 'crypto',
      status: TRANSFER_DETAILS_STATUS.OPENED,
    } : {};


    const canApproveFunding = fundingStatus === FUNDING_STATUS.PENDING;
    const canRecordFunding = fundingStatus === FUNDING_STATUS.ACCEPTED;
    const canSettleRepayment = fundingStatus === FUNDING_STATUS.REPAYING_FUNDING;

    return (
      <>
        <Modal
          opened={addTransferDetails}
          headingProps={{ level: 3 }}
          title={`Record funding`}
          onClose={this.closeTransferDetails}
        >
          <TransferDetailsForm
            onSubmit={this.submitTransferDetails}
            onDiscard={this.closeTransferDetails}
            contacts={contacts}
            transferDetails={fundingDetails}
          />
        </Modal>
        <Box pad={{ bottom: 'large' }}>
          <SecondaryHeader>
            <Box direction="row" gap="small" align="center">
              <Link to={routes.invoices.index} size="large">
                <LinkPrevious/>
              </Link>

              <Heading level="3">
                Funding Agreement for Invoice #{invoice!.data!.number}
              </Heading>
            </Box>
            <Box direction="row" gap="medium">
              {
                canApproveFunding && <Button
                  onClick={this.signFundingAgreement}
                  primary
                  label="Approve"
                />
              }


              {
                canRecordFunding && <Button
                  primary
                  label="Record funding transfer"
                  onClick={this.openTransferDetails}
                />
              }

              {
                canSettleRepayment && <Button
                  primary
                  label="Confirm as repaid"
                  onClick={this.settleFundingAgreement}
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
    signingFunding: state.funding.sign,
    creatingTransferDetails: state.transferDetails.create,
    settlingFunding: state.funding.settle,
    contacts: mapContactsToLabelKeyPair(state, true),
  };
};

export const ConnectedFundingAgreementView = connect(
  mapStateToProps,
  {
    getContacts,
    resetGetContacts,
    getInvoiceById,
    resetGetInvoiceById,
    signFunding,
    createTransferDetails,
    updateTransferDetails,
    settleFunding,
  },
)(withRouter(FundingAgreementView));


