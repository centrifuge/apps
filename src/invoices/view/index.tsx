import React from 'react';

import { connect } from 'react-redux';

import Invoices from './Invoices';
import { getInvoices } from '../../actions/invoices';
import { RequestState } from '../../reducers/http-request-reducer';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';

const mapStateToProps = (state: {
  invoices: { get: RequestState<InvoiceInvoiceData[]> };
}) => {
  return {
    invoices: state.invoices.get.data,
    loading: state.invoices.get.loading,
  };
};

type ViewInvoicesProps = {
  getInvoices: () => void;
  clearInvoices: () => void;
  invoices?: InvoiceInvoiceData[];
  loading: boolean;
};

class ViewInvoices extends React.Component<ViewInvoicesProps> {
  componentDidMount() {
    this.props.getInvoices();
  }

  render() {
    if (this.props.loading) {
      return 'Loading';
    }

    return <Invoices invoices={this.props.invoices as InvoiceInvoiceData[]} />;
  }
}

export default connect(
  mapStateToProps,
  { getInvoices },
)(ViewInvoices);
