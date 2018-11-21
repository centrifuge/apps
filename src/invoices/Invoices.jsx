// Converted to JSX until https://github.com/grommet/grommet/issues/2464 is fixed

import React from 'react';
import { Box, DataTable, Heading } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import invoiceRoutes from './routes';

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
    property: 'number',
    header: 'Actions',
    render: () => (
      <Box direction="row" gap="small">
        <Edit />
        <More />
      </Box>
    ),
  },
];

const SAMPLE_DATA = [
  {
    number: '111',
    customer: 'John doe',
    supplier: 'amazon.com',
    status: 'in queue',
  },
];

export default class Invoices extends React.Component {
  displayName = 'Invoices';

  render() {
    return (
      <Box fill>
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
          <DataTable data={SAMPLE_DATA} columns={columns} />
        </Box>
      </Box>
    );
  }
}
