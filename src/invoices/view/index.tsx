import React from 'react';

import { connect } from 'react-redux';

import Invoices from './Invoices';
import { getInvoices } from '../../actions/invoices';
import { RequestState } from '../../reducers/http-request-reducer';
import {
  InvoiceInvoiceData,
  InvoiceInvoiceResponse,
} from '../../../clients/centrifuge-node/generated-client';

interface InvoiceResponse extends InvoiceInvoiceResponse {
  data: InvoiceInvoiceData & { _id: string };
}

const mapStateToProps = (state: {
  invoices: {
    get: RequestState<InvoiceResponse[]>;
  };
}) => {
  return {
    invoices:
      state.invoices.get.data &&
      state.invoices.get.data.map(response => response.data),
    loading: state.invoices.get.loading,
  };
};

type ViewInvoicesProps = {
  getInvoices: () => void;
  clearInvoices: () => void;
  invoices?: InvoiceInvoiceData & { _id: string }[];
  loading: boolean;
};

class ViewInvoices extends React.Component<ViewInvoicesProps> {
  componentDidMount() {
    this.props.getInvoices();
  }

  render() {
    if (this.props.loading || !this.props.invoices) {
      return 'Loading';
    }

    return <Invoices invoices={this.props.invoices} />;
  }
}

export default connect(
  mapStateToProps,
  { getInvoices },
)(ViewInvoices);
