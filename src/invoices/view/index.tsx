import React from 'react';

import { connect } from 'react-redux';

import Invoices from './Invoices';
import { getInvoices } from '../../actions/invoices';
import { RequestState } from '../../reducers/http-request-reducer';
import { InvoiceData } from '../../interfaces';

const mapStateToProps = (state: {
  invoices: { get: RequestState<InvoiceData[]> };
}) => {
  return {
    invoices: state.invoices.get.data,
    loading: state.invoices.get.loading,
  };
};

type ViewInvoicesProps = {
  getInvoices: () => void;
  clearInvoices: () => void;
  invoices?: InvoiceData[];
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
