import React from 'react';
import { Box, Button, DataTable, Heading, Text } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import invoiceRoutes from './routes';
import { InvoiceData } from '../common/interfaces';
import { RouteComponentProps, withRouter } from 'react-router';

// Casting to "any" until https://github.com/grommet/grommet/issues/2464 is fixed
const DataTableSupressedWarning = DataTable as any;

type InvoicesProps = { invoices: InvoiceData[] };

class InvoiceList extends React.Component<InvoicesProps & RouteComponentProps> {
  displayName = 'Invoices';

  render() {
    return (
      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Invoices</Heading>
          <Link to={invoiceRoutes.new}>
            <Button
              icon={<Add color="white" size="small" />}
              primary
              label="Add new"
            />
          </Link>
        </Box>

        <Box>
          <DataTableSupressedWarning
            data={this.props.invoices}
            columns={[
              {
                property: 'invoice_number',
                header: 'Number',
              },
              {
                property: 'recipient_name',
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
                    <Edit
                      onClick={() =>
                        this.props.history.push(
                          `${invoiceRoutes.index}/${datum._id}`,
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

export default withRouter(InvoiceList);
