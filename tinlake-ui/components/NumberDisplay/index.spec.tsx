import React from 'react'
import renderer from 'react-test-renderer'
import NumberDisplay from '.'

it('renders correctly', () => {
  const tree = renderer.create(<NumberDisplay value="134144" precision={3} prefix="o" suffix=" CCC" />).toJSON()
  expect(tree).toMatchSnapshot()
})
