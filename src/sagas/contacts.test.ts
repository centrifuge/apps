import { call, put, takeEvery } from 'redux-saga/effects';

import {
    createContact,
    default as defaultExports,
    getContacts, updateContact,
} from './contacts';

import {createContactAction, getContactsAction, updateContactAction} from '../actions/contacts';

import { httpClient } from '../http-client';
import { Contact } from '../common/models/dto/contact';

const contact = new Contact('alfred', '0xbatman_manor');

describe('watchGetContactsPage', () => {
  it('should call getContacts', function() {
    const onWatchGetContactsPage = defaultExports.watchGetContactsPage();

    expect(onWatchGetContactsPage).toEqual(
      takeEvery(getContactsAction.start, getContacts),
    );
  });
});

describe('watchCreateContact', () => {
  it('should call createContact and go back on success', function() {
    const onWatchCreateContact = defaultExports.watchCreateContact();

    expect(onWatchCreateContact).toEqual(
      takeEvery(createContactAction.start, createContact),
    );
  });
});

describe('getContacts', () => {
  it('should call the http client on success', function() {
    const gen = getContacts();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.contacts.read));

    const successResponse = gen.next({ data: contact }).value;
    expect(successResponse).toEqual(
      put({
        type: getContactsAction.success,
        payload: contact,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = getContacts();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.contacts.read));

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: getContactsAction.fail,
        payload: error,
      }),
    );
  });
});

describe('createContact', () => {
  it('should call the http client on success', function() {
    const gen = createContact({ contact });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.contacts.create, contact),
    );

    const successResponse = gen.next({ data: contact }).value;
    expect(successResponse).toEqual(
      put({
        type: createContactAction.success,
        payload: contact,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = createContact({ contact });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.contacts.create, contact),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: createContactAction.fail,
        payload: error,
      }),
    );
  });
});


describe('updateContact', () => {
  it('should call the http client and fetch the contacts', function() {
    const gen = updateContact({ contact });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.contacts.update, contact),
    );

    const successResponse = gen.next({ data: contact }).value;
    expect(successResponse).toEqual(
      put({
        type: updateContactAction.success,
        payload: contact,
      }),
    );
    expect(gen.next().value).toEqual(
      put({
        type: getContactsAction.start,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = updateContact({ contact });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.contacts.update, contact),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: updateContactAction.fail,
        payload: error,
      }),
    );
  });
});
