import { mount, shallow } from 'enzyme';
import React from 'react';
import {defaultSchemas, defaultUser} from '../../test-utilities/default-data';
import { SearchSelect } from '@centrifuge/axis-search-select';
import MintNftForm from '../MintNftForm';
import { withAxis } from '../../test-utilities/test-providers';
import { TextInput } from 'grommet';

describe('Mint NFT Form', () => {

  const onSubmit = jest.fn(() => {
  });

  const onDiscard = jest.fn(() => {
  });

  beforeEach(() => {
    onSubmit.mockClear();
    onDiscard.mockClear();
  });


  it('Should render the MintNftForm', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}
        />,
      ),
    );

    const registryField = component.find({ name: 'registry' }).find(SearchSelect);
    expect(registryField.prop('value')).toEqual(defaultSchemas[0].registries[0])
    const options = registryField.prop('options');
    expect(options).toBe(defaultSchemas[0].registries);
  });

  it('Should display deposit_address field and prepopulate the form with the registry', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}
        />,
      ),
    );
    const depositAddress = component.find({ name: 'deposit_address' }).find(TextInput);
    expect(depositAddress.length).toBe(1);
    expect(depositAddress.prop('value')).toEqual('')
  });

  it('Should not submit the form because of validation', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}
        />,
      ),
    );

    const submit = component.find({ label: 'Mint' }).find('button');
    submit.simulate('click');
    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('Should submit the form', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}
        />,
      ),
    );

    const registryField = component.find({ name: 'registry' }).find(SearchSelect);
    registryField.prop('onChange')(defaultSchemas[0].registries[0]);

    const submit = component.find({ label: 'Mint' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledWith({
      registry: defaultSchemas[0].registries[0],
      deposit_address:'',
    });
  });


  it('Should discard the form', async () => {

    const component = mount(
      withAxis(
        <MintNftForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          registries={defaultSchemas[0].registries}
        />,
      ),
    );
    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});


