import React from 'react';

import { connect } from 'react-redux';

import PurchaseOrderForm from './PurchaseOrderForm';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../store/reducers/http-request-reducer';
import { PurchaseorderPurchaseOrderResponse } from '../../clients/centrifuge-node/generated-client';
import { Contact } from '../common/models/contact';
import { getContacts, resetGetContacts } from '../store/actions/contacts';
import { LabelValuePair } from '../common/interfaces';
import {
  getPurchaseOrderById,
  resetGetPurchaseOrderById,
  resetUpdatePurchaseOrder,
  updatePurchaseOrder,
} from '../store/actions/purchase-orders';
import { PurchaseOrder } from '../common/models/purchase-order';

type ConnectedEditPurchaseOrderProps = {
  updatePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  resetUpdatePurchaseOrder: () => void;
  purchaseOrder?: PurchaseOrder;
  getPurchaseOrderById: (id: string) => void;
  resetGetPurchaseOrderById: () => void;
  purchaseOrderId: string;
  getContacts: () => void;
  resetGetContacts: () => void;
  purchaseOrderLoading: boolean;
  contactsLoading: boolean;
  contacts?: LabelValuePair[];
} & RouteComponentProps<{ id?: string }>;

class ConnectedEditPurchaseOrder extends React.Component<
  ConnectedEditPurchaseOrderProps
> {
  componentDidMount() {
    if (!this.props.contacts) {
      this.props.getContacts();
    }

    if (this.props.match.params.id) {
      this.props.getPurchaseOrderById(this.props.match.params.id);
    }
  }

  componentWillUnmount() {
    this.props.resetGetContacts();
    this.props.resetGetPurchaseOrderById();
    this.props.resetUpdatePurchaseOrder();
  }

  updatePurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    this.props.updatePurchaseOrder(purchaseOrder);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    if (this.props.purchaseOrderLoading) {
      return 'Loading purchase order';
    }

    if (this.props.contactsLoading || !this.props.contacts) {
      return 'Loading';
    }

    return (
      <PurchaseOrderForm
        onSubmit={this.updatePurchaseOrder}
        onCancel={this.onCancel}
        contacts={this.props.contacts}
        purchaseOrder={this.props.purchaseOrder}
      />
    );
  }
}

export default connect(
  (state: {
    purchaseOrders: {
      getById: RequestState<
        PurchaseorderPurchaseOrderResponse & { _id: string }
      >;
    };
    contacts: { get: RequestState<Contact[]> };
  }) => {
    return {
      purchaseOrderLoading: state.purchaseOrders.getById.loading,
      purchaseOrder: state.purchaseOrders.getById.data && {
        _id: state.purchaseOrders.getById.data._id,
        ...state.purchaseOrders.getById.data.data,
        collaborators: state.purchaseOrders.getById.data.header!.collaborators,
      },
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
    getContacts,
    resetGetContacts,
    updatePurchaseOrder,
    resetUpdatePurchaseOrder,
    getPurchaseOrderById,
    resetGetPurchaseOrderById,
  },
)(withRouter(ConnectedEditPurchaseOrder));
