import React from 'react';

import { connect } from 'react-redux';

import Invoices from './Invoices';
import { getInvoices } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { RequestState } from '../../reducers/http-request-reducer';

const mapStateToProps = (state: {
  invoices: { get: RequestState<Invoice[]> };
}) => {
  return {
    invoices: state.invoices.get.data,
    loading: state.invoices.get.loading,
  };
};

type ViewInvoicesProps = {
  getInvoices: () => void;
  clearInvoices: () => void;
  invoices?: Invoice[];
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

    return <Invoices invoices={this.props.invoices as Invoice[]} />;
  }
}

export default connect(
  mapStateToProps,
  { getInvoices },
)(ViewInvoices);
