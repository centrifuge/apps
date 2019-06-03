import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { fundingRoutes } from './routes';
import { View } from 'grommet-icons';
import { RouteComponentProps, withRouter } from 'react-router';
import { dateFormatter } from '../common/formaters';
import { FunFundingData, FunFundingSignature } from '../../clients/centrifuge-node';


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
      return <></>;
    }

    console.log(this.props.fundingAgreements);

    return (

      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Funding Agreements</Heading>

        </Box>

        <Box>
          <DataTable
            sortable={true}
            data={this.props.fundingAgreements}
            primaryKey={'funding_id'}
            columns={[
              {
                property: 'sender_company_name',
                header: 'Borrower',
              },
              {
                property: 'funding_id',
                header: 'Funding Agreement ID',
                render: datum => {
                  return <Box width={'small'}>
                    <Text style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{datum.funding_id}</Text>
                  </Box>;
                },

              },
              {
                property: 'number',
                header: 'Invoice Number',
              },
              {
                property: 'net_amount',
                header: 'Invoice Total',
              },
              {
                property: 'amount',
                header: 'Funding Amount',
              },
              {
                property: 'repayment_due_date',
                header: 'Repayment Due Date',
                render: datum => {
                  return dateFormatter(datum.repayment_due_date);
                },
              },

              {
                property: 'invoice_status',
                header: 'Funding Status',
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
