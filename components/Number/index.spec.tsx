import React from 'react';
import Number from '.';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer
    .create(<Number value="134144" precision={3} prefix="o" suffix=" CCC" />)
    .toJSON();
  expect(tree).toMatchSnapshot();
});
