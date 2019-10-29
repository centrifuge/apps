import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { Modal } from '@centrifuge/axis-modal';
import { defaultSchemas } from '../../test-utilities/default-data';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { SearchSelect } from '@centrifuge/axis-search-select';
import MintNftForm from '../MintNftForm';
import { withAxis } from '../../test-utilities/test-providers';
import { CheckBox, TextInput } from 'grommet';

describe('Mint NFT Form', () => {

  const nft = {
    token_id: '0xSomeTokenId',
    owner: '0xsomeOwner',
    registry: '0xSomeRegistry',
  };

  const onSubmit = jest.fn(() => {
  });

  const onDiscard = jest.fn(() => {
  });


  it('Should render the MintNftForm', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}/>,
      ),
    );

    const registryField = component.find({ name: 'registry' }).find(SearchSelect);
    const transferToSomeElse = component.find({ name: 'transfer' }).find(CheckBox);
    const options = registryField.prop('options');
    expect(options).toBe(defaultSchemas[0].registries);
    expect(transferToSomeElse.prop('checked')).toBe(false);
  });

  it('Should display deposit_address field when check box is checked', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}/>,
      ),
    );
    const transferToSomeElse = component.find({ name: 'transfer' }).find(CheckBox);
    transferToSomeElse.find('input').simulate('change', { target: { value: true, name: 'transfer' } });
    expect(component.find({ name: 'transfer' }).find(CheckBox).prop('checked')).toBe(true);
    const depositAddress = component.find({ name: 'deposit_address' }).find(TextInput);
    expect(depositAddress.length).toBe(1);
  });


  it('Should not submit the form because of validation', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}/>,
      ),
    );
    const submit = component.find({ label: 'Mint' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(0);

  });

  it('Should  submit the form', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}/>,
      ),
    );

    const registryField = component.find({ name: 'registry' }).find(SearchSelect);
    registryField.prop('onChange')(defaultSchemas[0].registries[0]);

    const submit = component.find({ label: 'Mint' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      transfer: false,
      registry: defaultSchemas[0].registries[0],
      deposit_address: '',
    });

  });


  it('Should discard the form', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}/>,
      ),
    );
    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);

  });


});


