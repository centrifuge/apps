import React, { ReactNode } from 'react';
import { Box, Button, DataTable, Heading } from 'grommet';
import { Add, Edit, More } from 'grommet-icons';
import { Link } from 'react-router-dom';

import purchaseOrderRoutes from '../routes';
import routes from '../routes';
import { Contact } from '../../common/models/dto/contact';
import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node/generated-client';
import { RouteComponentProps, withRouter } from 'react-router';

interface PurchaseOrdersTableColumn {
  property:
    | keyof (PurchaseorderPurchaseOrderData & { _id?: string })
    | keyof [keyof { supplier: Contact }];
  header: string;
  render?: (
    this: { props: PurchaseOrdersProps & RouteComponentProps },
    datum: PurchaseorderPurchaseOrderData,
  ) => ReactNode;
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
    render: function(datum) {
      return (
        <Box direction="row" gap="small">
          <Edit
            onClick={function() {
              //@ts-ignore
              console.log(this.props);
            }}
          />
        </Box>
      );
    },
  },
];

type PurchaseOrdersProps = { purchaseOrders: PurchaseorderPurchaseOrderData[] };

class PurchaseOrdersList extends React.Component<
  PurchaseOrdersProps & RouteComponentProps
> {
  displayName = 'PurchaseOrdersList';

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
            columns={[
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
                render: datum => (
                  <Box direction="row" gap="small">
                    <Edit
                      onClick={() =>
                        this.props.history.push(`${routes.index}/${datum._id}`)
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

export default withRouter(PurchaseOrdersList);
