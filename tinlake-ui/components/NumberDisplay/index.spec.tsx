import React from 'react'
import NumberDisplay from '.'
import renderer from 'react-test-renderer'

it('renders correctly', () => {
  const tree = renderer.create(<NumberDisplay value="134144" precision={3} prefix="o" suffix=" CCC" />).toJSON()
  expect(tree).toMatchSnapshot()
})
