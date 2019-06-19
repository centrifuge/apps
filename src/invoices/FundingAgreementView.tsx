import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Heading } from 'grommet';
import { LabelValuePair } from '../common/interfaces';
import { connect } from 'react-redux';
import { RequestState } from '../store/reducers/http-request-reducer';
import { DocumentResponseHeader, FunFundingResponse, FunFundingResponseData } from '../../clients/centrifuge-node';
import { getInvoiceById, resetGetInvoiceById } from '../store/actions/invoices';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { RouteComponentProps, withRouter } from 'react-router';
import { LinkPrevious } from 'grommet-icons';
import routes from '../routes';
import { signFunding } from '../store/actions/funding';
import { InvoiceDetails } from './InvoiceDetails';
import { Invoice } from '../common/models/invoice';
import { Preloader } from '../components/Preloader';

type ConnectedFundingAgreementViewProps = {
  getInvoiceById: typeof getInvoiceById;
  resetGetInvoiceById: typeof resetGetInvoiceById;
  getContacts: typeof getContacts;
  signFunding: typeof signFunding;
  resetGetContacts: typeof resetGetInvoiceById;
  invoice: Invoice | null;
  header: DocumentResponseHeader | null,
  fundingAgreement: FunFundingResponseData | null,
  id: string | null,
  contacts?: LabelValuePair[];
  signingFunding: RequestState<FunFundingResponse>;
} & RouteComponentProps<{ id?: string }>;

export class FundingAgreementView extends React.Component<ConnectedFundingAgreementViewProps> {

  displayName = 'FundingAgreementView';

  componentDidMount() {
    if (this.props.match.params.id) {
      this.props.getContacts();
      this.props.getInvoiceById(this.props.match.params.id);
    }
  }


  signFundingAgreement = () => {
    const { id, fundingAgreement, header, signFunding } = this.props;
    signFunding({
      document_id: header!.document_id,
      agreement_id: fundingAgreement!.funding!.agreement_id,
      invoice_id: id!,
    });
  };

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetInvoiceById();
  }

  render() {
    const { invoice, contacts, fundingAgreement, signingFunding } = this.props;
    if (!invoice || !contacts) {
      return <Preloader message="Loading"/>;
    }

    if (signingFunding && signingFunding.loading) {
      return <Preloader message="Approving funding agreement" withSound={true}/>;
    }

    const canApproveFunding = !(fundingAgreement && fundingAgreement.signatures);

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
                onClick={this.signFundingAgreement}
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
      signingFunding: state.funding.sign,
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
    signFunding,
  },
)(withRouter(FundingAgreementView));


