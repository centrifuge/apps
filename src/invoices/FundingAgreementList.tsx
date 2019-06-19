import React from 'react';
import { connect } from 'react-redux';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { Anchor, Box, DataTable, Heading, Text } from 'grommet';
import { fundingRoutes } from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatCurrency, formatDate } from '../common/formaters';
import { FunFundingData, FunFundingSignature } from '../../clients/centrifuge-node';
import { Preloader } from '../components/Preloader';


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
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Funding Agreements</Heading>

        </Box>

        <Box>
          <DataTable
            sortable={true}
            data={this.props.fundingAgreements}
            primaryKey={'agreement_id'}
            columns={[
              {
                property: 'sender_company_name',
                header: 'Borrower',
              },
              {
                property: 'agreement_id',
                header: 'Funding agreement ID',
                render: datum => {
                  return <Box width={'small'}>
                    <Text style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{datum.agreement_id}</Text>
                  </Box>;
                },

              },
              {
                property: 'number',
                header: 'Invoice number',
              },
              {
                property: 'net_amount',
                header: 'Net amount',
                align: 'end',
                render: datum => {
                  return formatCurrency(datum.amount, datum.currency);
                },
              },
              {
                property: 'amount',
                header: 'Funding amount',
                align: 'end',
                render: datum => {
                  return formatCurrency(datum.amount, datum.currency);
                },
              },

              {
                property: 'repayment_due_date',
                header: 'Repayment due date',
                render: datum => {
                  return formatDate(datum.repayment_due_date);
                },
              },

              {
                property: 'invoice_status',
                header: 'Funding status',
                render: datum => {
                  return datum.signatures ? <Text color={'status-ok'}>Accepted</Text> : <Text>Received</Text>;
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
    fundingAgreements:
      state.invoices.get.data &&
      (state.invoices.get.data.filter(item => item.fundingAgreement).map(response => ({
        ...response.fundingAgreement.funding,
        signatures: response.fundingAgreement.signatures,
        sender_company_name: response.data.sender_company_name,
        net_amount: response.data.net_amount,
        number: response.data.number,
        _id: response._id,
      }))),
    loading: state.invoices.get.loading,
  };
};

export default connect(
  mapStateToProps,
  { getInvoices, resetGetInvoices },
)(withRouter(FundingAgreementList));
