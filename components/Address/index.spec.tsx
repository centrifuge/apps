import React from 'react';
import Address from '.';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer
    .create(<Address address="0x1234567891011" />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
