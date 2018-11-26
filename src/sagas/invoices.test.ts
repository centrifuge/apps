import { call, fork, put, take } from 'redux-saga/effects';
import { goBack } from 'connected-react-router';

import {
  createInvoice,
  getInvoices,
  watchCreateInvoice,
  watchGetInvoicesPage,
} from './invoices';

import {
  CREATE_INVOICE_ACTION_TYPES,
  GET_INVOICE_ACTION_TYPES,
} from '../actions/invoices';

import { Invoice } from '../common/models/dto/invoice';
import { httpClient } from '../http-client';

const invoice = new Invoice(1, 'mickey', 'goofy', 'created');

describe('watchGetInvoicesPage', () => {
  it('should call getInvoices', function() {
    const gen = watchGetInvoicesPage();

    const onGetInvoiceAction = gen.next().value;
    expect(onGetInvoiceAction).toEqual(take(GET_INVOICE_ACTION_TYPES.start));

    const getInvoicesInvocation = gen.next().value;
    expect(getInvoicesInvocation).toEqual(fork(getInvoices));
  });
});

describe('watchCreateInvoice', () => {
  it('should call createInvoice and then go back', function() {
    const gen = watchCreateInvoice();

    const onGetInvoiceAction = gen.next().value;
    expect(onGetInvoiceAction).toEqual(take(CREATE_INVOICE_ACTION_TYPES.start));

    const getInvoicesInvocation = gen.next({
      type: CREATE_INVOICE_ACTION_TYPES.start,
      invoice,
    }).value;
    expect(getInvoicesInvocation).toEqual(fork(createInvoice, invoice));

    const goBackInvocation = gen.next().value;
    expect(goBackInvocation).toEqual(put(goBack()));
  });
});

describe('getInvoices', () => {
  it('should call the http client on success', function() {
    const gen = getInvoices();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.invoices.read));

    const successResponse = gen.next({ data: invoice }).value;
    expect(successResponse).toEqual(
      put({
        type: GET_INVOICE_ACTION_TYPES.success,
        payload: invoice,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = getInvoices();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.invoices.read));

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: GET_INVOICE_ACTION_TYPES.fail,
        payload: error,
      }),
    );
  });
});

describe('createInvoice', () => {
  it('should call the http client on success', function() {
    const gen = createInvoice(invoice);

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.invoices.create, invoice));

    const successResponse = gen.next({ data: invoice }).value;
    expect(successResponse).toEqual(
      put({
        type: CREATE_INVOICE_ACTION_TYPES.success,
        payload: invoice,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = createInvoice(invoice);

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.invoices.create, invoice));

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: CREATE_INVOICE_ACTION_TYPES.fail,
        payload: error,
      }),
    );
  });
});
