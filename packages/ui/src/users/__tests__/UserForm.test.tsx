import React from 'react';
import { mount } from 'enzyme';
import UserForm from '../UserForm';
import { User } from '@centrifuge/gateway-lib/models/user';
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants';

it('Should render the create state', () => {
  const user = new User();
  const schemas = [];

  const form = mount(
    <UserForm user={user} schemas={schemas}/>,
  );

  expect(form.html()).toMatchSnapshot();
});


it('Should render in edit state with all fields including values for schemas input', () => {
  const user = new User();
  user.name = 'Test User';
  user.email = 'test@centrifuge.io';
  user.permissions = [PERMISSIONS.CAN_MANAGE_SCHEMAS, PERMISSIONS.CAN_MANAGE_DOCUMENTS];
  user.schemas = ['option-1'];
  const schemas = [{ name: 'option-1' }, { name:  'option-2'}] ;

  const form = mount(
    <UserForm user={user} schemas={schemas}/>,
  );
  expect(form.html()).toMatchSnapshot();
});
