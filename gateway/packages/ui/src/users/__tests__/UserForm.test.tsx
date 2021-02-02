import React from 'react';
import { mount } from 'enzyme';
import UserForm from '../UserForm';
import { User, UserWithOrg } from '@centrifuge/gateway-lib/models/user';
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants';
import { Organization } from '@centrifuge/gateway-lib/models/organization';
import { CheckBox, TextInput } from 'grommet';
import { Schema } from '@centrifuge/gateway-lib/models/schema';

it('Should render the create state', () => {
  const user = new User();
  const schemas = [];
  const organizations = [new Organization('My Org', '0x483838')];

  const form = mount(
    <UserForm user={user} schemas={schemas} organizations={organizations} />,
  );
  expect(form.html()).toMatchSnapshot();
});

it('Should render in edit state with all fields including values for schemas input', () => {
  const organizations = [
    new Organization('My Org', '0x483838'),
    new Organization('My Second Org', '0x48383833'),
  ];
  const user: UserWithOrg = {
    ...new UserWithOrg(),
    account: organizations[1].account,
  };
  user.name = 'Test User';
  user.email = 'test@centrifuge.io';
  user.permissions = [
    PERMISSIONS.CAN_MANAGE_SCHEMAS,
    PERMISSIONS.CAN_MANAGE_DOCUMENTS,
  ];
  user.schemas = ['option-1'];
  const schemas = [
    { name: 'option-1' } as Schema,
    { name: 'option-2' } as Schema,
  ];

  const form = mount(
    <UserForm user={user} schemas={schemas} organizations={organizations} />,
  );
  expect(form.html()).toMatchSnapshot();
});

it('Should switch to create a new organization', async () => {
  const user = new User();
  const schemas = [];
  const organizations = [new Organization('My Org', '0x483838')];
  user.account = organizations[0].account!;
  const form = mount(
    <UserForm user={user} schemas={schemas} organizations={organizations} />,
  );

  form
    .find(CheckBox)
    .find('input')
    .simulate('change', { target: { value: true, checked: true } });

  const orgInput = form.find({ name: 'organizationName' }).find('input');
  expect(orgInput.length).toEqual(1);
  expect(orgInput.props().value).toEqual('');
});
