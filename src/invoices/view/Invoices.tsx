import React from 'react';
import { Box, DataTable, Heading } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import invoiceRoutes from '../routes';
import { Invoice } from '../../common/models/dto/invoice';

// Casting to "any" until https://github.com/grommet/grommet/issues/2464 is fixed
const DataTableSupressedWarning = DataTable as any;

const columns = [
  {
    property: 'number',
    header: 'Number',
  },
  {
    property: 'customer',
    header: 'Customer',
  },
  {
    property: 'supplier',
    header: 'Supplier',
  },
  {
    property: 'status',
    header: 'Status',
  },
  {
    property: 'actions',
    header: 'Actions',
    render: () => (
      <Box direction="row" gap="small">
        <Edit />
        <More />
      </Box>
    ),
  },
];

type InvoicesProps = { invoices: Invoice[] };

export default class Invoices extends React.Component<InvoicesProps> {
  displayName = 'Invoices';

  render() {
    return (
      <Box fill="true">
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Invoices</Heading>
          <Link to={invoiceRoutes.new}>
            <Box justify="center" align="center" direction="row">
              <Add />
              Add new
            </Box>
          </Link>
        </Box>

        <Box>
          <DataTableSupressedWarning
            data={this.props.invoices}
            columns={columns}
          />
        </Box>
      </Box>
    );
  }
}
