import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import AttributeField from '../AttributeField';
import { Attribute, AttrTypes } from '@centrifuge/gateway-lib/models/schema';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { Select, TextInput } from 'grommet';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';

describe('AttributeField', () => {

  it('Should render a DECIMAL ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.DECIMAL,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(NumberInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(NumberInput).prop('disabled')).not.toBeUndefined();
  });

  it('Should render a INTEGER ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.INTEGER,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(NumberInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);
    expect(input.prop('precision')).toEqual(0);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(NumberInput).prop('disabled')).not.toBeUndefined();

  });

  it('Should render a PERCENT ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.PERCENT,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(NumberInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);
    expect(input.prop('precision')).toEqual(2);
    expect(input.prop('suffix')).toEqual('%');

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(NumberInput).prop('disabled')).not.toBeUndefined();

  });

  it('Should render a STRING ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.STRING,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(TextInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(TextInput).prop('disabled')).not.toBeUndefined();

  });

  it('Should render a BYTES ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.BYTES,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(TextInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(TextInput).prop('disabled')).not.toBeUndefined();

  });

  it('Should render a TIMESTAMP ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.TIMESTAMP,
      label: 'Some Input label',
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(DateInput);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual(`attributes.${attr.name}.value`);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(DateInput).prop('disabled')).not.toBeUndefined();

  });

  it('Should render Select with options instead of input ', () => {
    const attr: Attribute = {
      name: 'some_name',
      type: AttrTypes.STRING,
      label: 'Some Input label',
      options: [
        '1',
        '2',
        '3',
      ],
    };
    const component = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr}/>),
    );
    const input = component.find(Select);
    expect(input.prop('disabled')).toBeUndefined();
    expect(component.find('label').text()).toEqual(attr.label);
    expect(input.length).toEqual(1);
    expect(input.prop('options')).toEqual(attr.options);

    const disabled = mount(
      withAllProvidersAndContexts(
        <AttributeField attr={attr} isViewMode={true}/>),
    );

    expect(disabled.find(Select).prop('disabled')).not.toBeUndefined();

  });

})
;
