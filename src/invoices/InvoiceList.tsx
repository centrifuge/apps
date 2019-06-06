import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { InvoiceData } from '../common/interfaces';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { invoiceRoutes } from './routes';
import { Edit, View } from 'grommet-icons';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatCurrency, formatDate } from '../common/formaters';
import { Preloader } from '../components/Preloader';


type ViewInvoicesProps = {
  getInvoices: () => void;
  resetGetInvoices: () => void;
  invoices?: InvoiceData[];
  loading: boolean;
};

class InvoiceList extends React.Component<ViewInvoicesProps & RouteComponentProps> {
  displayName = 'InvoiceList';

  componentDidMount() {
    this.props.getInvoices();
  }

  componentWillUnmount() {
    this.props.resetGetInvoices();
  }


  render() {

    if (this.props.loading || !this.props.invoices) {
      return <Preloader message="Loading"/>;
    }



    return (
      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Invoices</Heading>
          <Link to={invoiceRoutes.new}>
            <Button
              primary
              label="Create Invoice"
            />
          </Link>
        </Box>

        <Box>
          <DataTable
            sortable={true}
            data={this.props.invoices}
            primaryKey={'_id'}
            columns={[
              {
                property: 'number',
                header: 'Invoice number',
              },

              {
                property: 'bill_to_company_name',
                header: 'Customer',
              },
              {
                property: 'net_amount',
                header: 'Net amount',
                align: 'end',
                render: datum => {
                  return formatCurrency(datum.net_amount, datum.currency);
                },
              },

              {
                property: 'date_created',
                header: 'Date created',
                render: datum => {
                  return formatDate(datum.date_created);
                },
              },

              {
                property: 'date_due',
                header: 'Date due',
                render: datum => {
                  return formatDate(datum.date_due);
                },
              },

              {
                property: 'invoice_status',
                header: 'Document status',
                render: datum => {
                  return <Text color={'status-ok'}>Created</Text>;
                },
              },

              {
                property: 'fundingAgreement',
                header: 'Funding status',
                render: datum => {
                  if(!datum.fundingAgreement) return '';
                  return datum.fundingAgreement.signatures ? <Text color={'status-ok'}>Approved</Text> : <Text>Pending</Text>;
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
                          invoiceRoutes.view.replace(':id', datum._id),
                        )
                      }
                    />
                    <Anchor
                      label={'Edit'}
                      onClick={() =>
                        this.props.history.push(
                          invoiceRoutes.edit.replace(':id', datum._id),
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
    invoices:
      state.invoices.get.data &&
      (state.invoices.get.data.map(response => ({
        ...response.data,
        _id: response._id,
        fundingAgreement: response.fundingAgreement,
        createdAt: response.createdAt,

      })) as InvoiceData[]),
    loading: state.invoices.get.loading,
  };
};

export default connect(
  mapStateToProps,
  { getInvoices, resetGetInvoices },
)(withRouter(InvoiceList));
