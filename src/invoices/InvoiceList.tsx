import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { invoiceRoutes } from './routes';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatCurrency, formatDate } from '../common/formaters';
import { Preloader } from '../components/Preloader';
import { InvInvoiceData } from '../../clients/centrifuge-node';
import { getInvoiceFundingStatus } from '../common/status';
import { Status } from '../components/Status';
import { SecondaryHeader } from '../components/SecondaryHeader';


type ViewInvoicesProps = {
  getInvoices: () => void;
  resetGetInvoices: () => void;
  invoices?: InvInvoiceData[];
  loading: boolean;
  error: any;
};

class InvoiceList extends React.Component<ViewInvoicesProps & RouteComponentProps> {

  displayName = 'InvoiceList';

  componentWillMount() {
    this.props.getInvoices();
  }

  componentWillUnmount() {
    this.props.resetGetInvoices();
  }


  render() {

    if (this.props.loading) {
      return <Preloader message="Loading"/>;
    }

    return (
      <Box>
        <SecondaryHeader>
          <Heading level="3">Invoices</Heading>
          <Link to={invoiceRoutes.new}>
            <Button
              primary
              label="Create Invoice"
            />
          </Link>
        </SecondaryHeader>

        <Box pad={{horizontal:'medium'}}>
          <DataTable
            sortable={false}
            data={this.props.invoices}
            primaryKey={'_id'}
            columns={[
              {
                property: 'number',
                header: 'Invoice number',
                render: datum => datum.data.number,
              },

              {
                property: 'bill_to_company_name',
                header: 'Customer',
                render: datum => datum.data.bill_to_company_name,
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
                property: 'date_created',
                header: 'Date created',
                render: datum => {
                  return formatDate(datum.data.date_created);
                },
              },

              {
                property: 'date_due',
                header: 'Date due',
                render: datum => {
                  return formatDate(datum.data.date_due);
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
    invoices: state.invoices.get.data || [],
    loading: state.invoices.get.loading,
    error: state.invoices.get.error,
  };
};


export default connect(
  mapStateToProps,
  {
    getInvoices,
    resetGetInvoices,
  },
)(withRouter(InvoiceList));
