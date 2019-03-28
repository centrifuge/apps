import { call, put, takeEvery } from 'redux-saga/effects';

import {
  createInvoice,
  default as defaultExports,
  getInvoiceById,
  getInvoices,
  updateInvoice,
} from './invoices';

import {
  createInvoiceAction,
  getInvoiceAction,
  getInvoiceByIdAction,
  updateInvoiceAction,
} from '../actions/invoices';

import { Invoice } from '../common/models/invoice';
import { httpClient } from '../http-client';

const invoice: Invoice = {
  invoice_number: '1',
  sender_name: 'mickey',
  recipient_name: 'goofy',
};

describe('watchGetInvoicesPage', () => {
  it('should call getInvoices', async function() {
    const onWatchGetInvoicesPage = await defaultExports.watchGetInvoicesPage();

    expect(onWatchGetInvoicesPage).toEqual(
      takeEvery(getInvoiceAction.start, getInvoices),
    );
  });
});

describe('watchCreateInvoice', () => {
  it('should call createInvoice and go back on success', function() {
    const onWatchCreateInvoice = defaultExports.watchCreateInvoice();

    expect(onWatchCreateInvoice).toEqual(
      takeEvery(createInvoiceAction.start, createInvoice),
    );
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
        type: getInvoiceAction.success,
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
        type: getInvoiceAction.fail,
        payload: error,
      }),
    );
  });
});

describe('createInvoice', () => {
  it('should call the http client on success', function() {
    const gen = createInvoice({ invoice });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.invoices.create, invoice),
    );

    const successResponse = gen.next({ data: invoice }).value;
    expect(successResponse).toEqual(
      put({
        type: createInvoiceAction.success,
        payload: invoice,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = createInvoice({ invoice });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.invoices.create, invoice),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: createInvoiceAction.fail,
        payload: error,
      }),
    );
  });
});

describe('getInvoiceById', function() {
  it('should call the client with the appropriate id', function() {});

  it('should set error on exception', function() {
    let idAction = { id: 'invoice_id' };
    const gen = getInvoiceById(idAction);

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.invoices.readById, idAction.id),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: getInvoiceByIdAction.fail,
        payload: error,
      }),
    );
  });
});

describe('updateInvoice', function() {
  it('should update the invoice and redirect to index', function() {
    const gen = updateInvoice({ invoice });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.invoices.update, invoice),
    );

    const successResponse = gen.next({ data: invoice }).value;
    expect(successResponse).toEqual(
      put({
        type: updateInvoiceAction.success,
        payload: invoice,
      }),
    );
  });

  it('should set error on exception ', function() {
    const gen = updateInvoice({ invoice });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.invoices.update, invoice),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: updateInvoiceAction.fail,
        payload: error,
      }),
    );
  });
});
