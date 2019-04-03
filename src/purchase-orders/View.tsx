import React from 'react';

import { connect } from 'react-redux';

import PurchaseOrders from './PurchaseOrderList';
import { RequestState } from '../store/reducers/http-request-reducer';
import { PurchaseorderPurchaseOrderData } from '../../clients/centrifuge-node/generated-client';
import {
  getPurchaseOrders,
  resetGetPurchaseOrders,
} from '../store/actions/purchase-orders';
import { PurchaseOrderResponse } from '../common/interfaces';

const mapStateToProps = (state: {
  purchaseOrders: {
    get: RequestState<(PurchaseOrderResponse)[]>;
  };
}) => {
  return {
    purchaseOrders:
      state.purchaseOrders.get.data &&
      (state.purchaseOrders.get.data.map(response => ({
        ...response.data,
        _id: response._id,
      })) as PurchaseorderPurchaseOrderData[]),
    loading: state.purchaseOrders.get.loading,
  };
};

type ViewInvoicesProps = {
  getPurchaseOrders: () => void;
  resetGetPurchaseOrders: () => void;
  clearInvoices: () => void;
  purchaseOrders?: PurchaseorderPurchaseOrderData[];
  loading: boolean;
};

class ViewInvoices extends React.Component<ViewInvoicesProps> {
  componentDidMount() {
    this.props.getPurchaseOrders();
  }

  componentWillUnmount() {
    this.props.resetGetPurchaseOrders();
  }

  render() {
    if (this.props.loading || !this.props.purchaseOrders) {
      return 'Loading';
    }

    return <PurchaseOrders purchaseOrders={this.props.purchaseOrders} />;
  }
}

export default connect(
  mapStateToProps,
  { getPurchaseOrders, resetGetPurchaseOrders },
)(ViewInvoices);
