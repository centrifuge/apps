import React from 'react';

import { connect } from 'react-redux';

import Invoices from './InvoiceList';
import { getInvoices, resetGetInvoices } from '../store/actions/invoices';
import { RequestState } from '../store/reducers/http-request-reducer';
import { InvoiceData, InvoiceResponse } from '../common/interfaces';

const mapStateToProps = (state: {
  invoices: {
    get: RequestState<InvoiceResponse[]>;
  };
}) => {
  return {
    invoices:
      state.invoices.get.data &&
      (state.invoices.get.data.map(response => ({
        ...response.data,
        _id: response._id,
      })) as InvoiceData[]),
    loading: state.invoices.get.loading,
  };
};

type ViewInvoicesProps = {
  getInvoices: () => void;
  resetGetInvoices: () => void;
  invoices?: InvoiceData[];
  loading: boolean;
};

class ViewInvoices extends React.Component<ViewInvoicesProps> {
  componentDidMount() {
    this.props.getInvoices();
  }

  componentWillUnmount() {
    this.props.resetGetInvoices();
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
  { getInvoices, resetGetInvoices },
)(ViewInvoices);
