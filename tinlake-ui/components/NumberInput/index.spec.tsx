import React from 'react'
import renderer from 'react-test-renderer'
import NumberInput from '.'

it('renders correctly', () => {
  const tree = renderer
    .create(
      <NumberInput
        value="134144"
        precision={3}
        prefix="o"
        suffix=" CCC"
        onValueChange={({ value }) => console.log(value)}
      />
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
})
