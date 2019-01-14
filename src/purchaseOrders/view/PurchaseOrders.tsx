import React, { ReactNode } from 'react';
import { Box, Button, DataTable, Heading } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import purchaseOrderRoutes from '../routes';
import { Contact } from '../../common/models/dto/contact';
import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node/generated-client';

interface PurchaseOrdersTableColumn {
  property:
    | keyof (PurchaseorderPurchaseOrderData & { _id?: string })
    | keyof [keyof { supplier: Contact }];
  header: string;
  render?: (datum: PurchaseorderPurchaseOrderData) => ReactNode;
  format?: Function;
}

// Casting to "any" until https://github.com/grommet/grommet/issues/2464 is fixed
const DataTableSupressedWarning = DataTable as any;

const columns: PurchaseOrdersTableColumn[] = [
  {
    property: 'po_number',
    header: 'Number',
  },
  {
    property: 'recipient_name',
    header: 'Customer',
  },
  {
    property: 'po_status',
    header: 'Status',
  },
  {
    property: '_id',
    header: 'Actions',
    render: () => (
      <Box direction="row" gap="small">
        <Edit />
      </Box>
    ),
  },
];

type PurchaseOrdersProps = { purchaseOrders: PurchaseorderPurchaseOrderData[] };

export default class PurchaseOrders extends React.Component<
  PurchaseOrdersProps
> {
  displayName = 'PurchaseOrders';

  render() {
    return (
      <Box fill>
        <Box justify="between" direction="row" align="center">
          <Heading level="3">Purchase orders</Heading>
          <Link to={purchaseOrderRoutes.new}>
            <Button
              icon={<Add color="white" size="small" />}
              primary
              label="Add new"
            />
          </Link>
        </Box>

        <Box>
          <DataTableSupressedWarning
            data={this.props.purchaseOrders}
            columns={columns}
          />
        </Box>
      </Box>
    );
  }
}
