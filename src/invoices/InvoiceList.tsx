import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { InvoiceData } from '../common/interfaces';
import { Anchor, Box, Button, DataTable, Heading, Text } from 'grommet';
import { invoiceRoutes } from './routes';
import { Edit, View } from 'grommet-icons';
import { RouteComponentProps, withRouter } from 'react-router';
import { formatDate } from '../common/formaters';


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
      return <></>;
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
                header: 'Invoice Number',
              },
              {
                property: 'sender_company_name',
                header: 'Supplier',
              },
              {
                property: 'bill_to_company_name',
                header: 'Recipient',
              },
              {
                property: 'date_created',
                header: 'Date Sent',
                render: datum => {
                  return formatDate(datum.createdAt);
                },
              },

              {
                property: 'invoice_status',
                header: 'Document Status',
                render: datum => {
                  return <Text color={'status-ok'}>Created</Text>;
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
        createdAt: response.createdAt,

      })) as InvoiceData[]),
    loading: state.invoices.get.loading,
  };
};

export default connect(
  mapStateToProps,
  { getInvoices, resetGetInvoices },
)(withRouter(InvoiceList));
