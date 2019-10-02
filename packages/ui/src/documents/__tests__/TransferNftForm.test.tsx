import { mount, shallow } from 'enzyme';
import React, { isValidElement } from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { Modal } from '@centrifuge/axis-modal';
import { defaultContacts } from '../../test-utilities/default-data';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { TextInput } from 'grommet';
import TransferNftForm from '../TransferNftForm';
import { withAxis } from '../../test-utilities/test-providers';

jest.mock('../../http-client');


describe('Transfer NFT Form', () => {

  const nft = {
    token_id: '0xSomeTokenId',
    owner: '0xsomeOwner',
    registry: '0xSomeRegistry',
  };

  const onSubmit = jest.fn(() => {
  });

  const onDiscard = jest.fn(() => {
  });


  it('Should render the TransferNftForm with suggestions', async () => {

    const component = mount(
      withAxis(
        <TransferNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          nft={nft}/>,
      ),
    );

    const toField = component.find({ name: 'to' }).find(TextInput);
    const suggestions = toField.prop('suggestions');
    expect(suggestions.length).toBe(3);
    expect(isValidElement(suggestions[0].label)).toBe(true);
    expect(suggestions[0].value).toBe(defaultContacts[0].address);
  });


  it('Should not submit the form because of validation', async () => {

    const component = mount(
      withAxis(
        <TransferNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          nft={nft}/>,
      ),
    );
    const submit = component.find({ label: 'Transfer' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(0);

  });

  it('Should not submit the form because of validation', async () => {

    const component = mount(
      withAxis(
        <TransferNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          nft={nft}/>,
      ),
    );

    const toField = component.find({ name: 'to' }).find(TextInput);
    toField.prop('onSelect')({ suggestion: { value: '0x44a0579754D6c94e7bB2c26bFA7394311Cc50Ccb' } });

    const submit = component.find({ label: 'Transfer' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      ...nft,
      to: '0x44a0579754D6c94e7bB2c26bFA7394311Cc50Ccb',
    });

  });


  it('Should discard the form', async () => {

    const component = mount(
      withAxis(
        <TransferNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          nft={nft}/>,
      ),
    );
    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);

  });


});


