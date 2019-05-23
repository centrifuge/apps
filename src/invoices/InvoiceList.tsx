import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvoiceData, InvoiceResponse } from '../common/interfaces';
import { Box, Button, DataTable, Heading, Text } from 'grommet';
import invoiceRoutes from './routes';
import { Edit, View } from 'grommet-icons';
import { RouteComponentProps, withRouter } from 'react-router';


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

    return  (
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
            data={this.props.invoices}
            columns={[
              {
                property: 'number',
                header: 'Number',
              },
              {
                property: 'bill_to_company_name',
                header: 'Customer',
              },
              {
                property: 'supplier',
                header: 'Supplier',
                render: data =>
                  data.supplier ? <Text>{data.supplier.name}</Text> : null,
              },
              {
                property: 'invoice_status',
                header: 'Status',
              },
              {
                property: '_id',
                header: 'Actions',
                render: datum => (
                  <Box direction="row" gap="small">
                    <View
                      onClick={() =>
                        this.props.history.push(
                          invoiceRoutes.view.replace(':id',datum._id),
                        )
                      }
                    />
                    <Edit
                      onClick={() =>
                        this.props.history.push(
                          invoiceRoutes.edit.replace(':id',datum._id),
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

const mapStateToProps = (state: {
  invoices: {
    get: RequestState<InvoiceResponse[]>;
  };
}) => {
  return {
    invoices:
      state.invoices.get.data &&
      (state.invoices.get.data.map(response => ({
        ...response.data,
        _id: response._id,
      })) as InvoiceData[]),
    loading: state.invoices.get.loading,
  };
};

export default connect(
  mapStateToProps,
  { getInvoices, resetGetInvoices },
)(withRouter(InvoiceList));
