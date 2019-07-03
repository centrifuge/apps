import React from 'react';
import { connect } from 'react-redux';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { Anchor, Box, DataTable, Heading, Text } from 'grommet';
import { fundingRoutes } from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatCurrency, formatDate } from '../common/formaters';
import { FunFundingData, FunFundingSignature } from '../../clients/centrifuge-node';
import { Preloader } from '../components/Preloader';
import { getInvoiceFundingStatus } from '../common/status';
import { SecondaryHeader } from '../components/SecondaryHeader';
import { Status } from '../components/Status';


type FundingAgreements = FunFundingData & {
  _id: string,
  signatures: Array<FunFundingSignature>,
  sender_company_name: string,
  net_amount: string,
  number: string
}[];

type ViewInvoicesProps = {
  getInvoices: () => void;
  resetGetInvoices: () => void;
  fundingAgreements?: FundingAgreements;
  loading: boolean;
};

class FundingAgreementList extends React.Component<ViewInvoicesProps & RouteComponentProps> {
  displayName = 'FundingAgreementList';

  componentDidMount() {
    this.props.getInvoices();
  }

  componentWillUnmount() {
    this.props.resetGetInvoices();
  }


  render() {

    if (this.props.loading || !this.props.fundingAgreements) {
      return <Preloader message="Loading"/>;
    }


    return (

      <Box fill>
        <SecondaryHeader>
          <Heading level="3">Funding Agreements</Heading>
        </SecondaryHeader>
        <Box pad={{ horizontal: 'medium' }}>
          <DataTable
            sortable={false}
            data={this.props.fundingAgreements}
            primaryKey={'agreement_id'}
            columns={[
              {
                property: 'sender_company_name',
                header: 'Borrower',
                render: datum => datum.data.sender_company_name,
              },
              {
                property: 'agreement_id',
                header: 'Funding agreement ID',
                render: datum => {
                  return <Box width={'small'}>
                    <Text style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{datum.data.agreement_id}</Text>
                  </Box>;
                },

              },
              {
                property: 'number',
                header: 'Invoice number',
                render: datum => datum.data.number,
              },
              {
                property: 'net_amount',
                header: 'Net amount',
                align: 'end',
                render: datum => {
                  return formatCurrency(datum.data.net_amount, datum.data.currency);
                },
              },
              {
                property: 'amount',
                header: 'Funding amount',
                align: 'end',
                render: datum => {
                  return formatCurrency(datum.fundingAgreement.funding.amount, datum.fundingAgreement.funding.currency);
                },
              },

              {
                property: 'repayment_due_date',
                header: 'Repayment due date',
                render: datum => {
                  return formatDate(datum.fundingAgreement.funding.repayment_due_date);
                },
              },

              {
                property: 'invoice_status',
                header: 'Funding status',
                render: datum => {
                  return <Status value={getInvoiceFundingStatus(datum)}/>;
                },
              },
              {
                property: '_id',
                header: 'Actions',
                render: datum => (
                  <Box direction="row" gap="small">
                    <Anchor
                      label={'View'}
                      onClick={() =>
                        this.props.history.push(
                          fundingRoutes.view.replace(':id', datum._id),
                        )
                      }
                    />
                  </Box>
                ),
              },
            ]}
          />
        </Box>
      </Box>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    fundingAgreements: state.invoices.get.data &&
      state.invoices.get.data.filter(item => item.fundingAgreement),
    loading: state.invoices.get.loading,
  };
};

export default connect(
  mapStateToProps,
  { getInvoices, resetGetInvoices },
)(withRouter(FundingAgreementList));
