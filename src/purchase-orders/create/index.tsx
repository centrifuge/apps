import React from 'react';

import { connect } from 'react-redux';

import CreatePurchaseOrder from '../CreateEditPurchaseOrder';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../../reducers/http-request-reducer';
import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node/generated-client';
import { Contact } from '../../common/models/contact';
import { getContacts, resetGetContacts } from '../../actions/contacts';
import { LabelValuePair } from '../../interfaces';
import {
  createPurchaseOrder,
  resetCreatePurchaseOrder,
} from '../../actions/purchase-orders';
import { PurchaseOrder } from '../../common/models/purchase-order';

type ConnectedCreatePurchaseOrderProps = {
  createPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  resetCreatePurchaseOrder: () => void;
  getContacts: () => void;
  resetGetContacts: () => void;
  purchaseOrdersLoading: boolean;
  contactsLoading: boolean;
  contacts?: LabelValuePair[];
} & RouteComponentProps;

class ConnectedCreatePurchaseOrder extends React.Component<
  ConnectedCreatePurchaseOrderProps
> {
  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
    }
  }

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetCreatePurchaseOrder();
  }

  createPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    this.props.createPurchaseOrder(purchaseOrder);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    if (this.props.purchaseOrdersLoading) {
      return 'Creating purchase order';
    }

    if (this.props.contactsLoading || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <CreatePurchaseOrder
        onSubmit={this.createPurchaseOrder}
        onCancel={this.onCancel}
        contacts={this.props.contacts}
      />
    );
  }
}

export default connect(
  (state: {
    purchaseOrders: { create: RequestState<PurchaseorderPurchaseOrderData> };
    contacts: { get: RequestState<Contact[]> };
  }) => {
    return {
      purchaseOrdersLoading: state.purchaseOrders.create.loading,
      contactsLoading: state.contacts.get.loading,
      contacts: state.contacts.get.data
        ? (state.contacts.get.data.map(contact => ({
            label: contact.name,
            value: contact.address,
          })) as LabelValuePair[])
        : undefined,
    };
  },
  {
    createPurchaseOrder,
    resetCreatePurchaseOrder,
    getContacts,
    resetGetContacts,
  },
)(withRouter(ConnectedCreatePurchaseOrder));
