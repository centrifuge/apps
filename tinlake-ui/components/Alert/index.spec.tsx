import React from 'react'
import Alert from '.'
import renderer from 'react-test-renderer'

it('renders errors correctly', () => {
  const tree = renderer.create(<Alert type="error">My error</Alert>).toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders infos correctly', () => {
  const tree = renderer.create(<Alert type="info">My info</Alert>).toJSON()
  expect(tree).toMatchSnapshot()
})

it('renders success correctly', () => {
  const tree = renderer.create(<Alert type="success">My success</Alert>).toJSON()
  expect(tree).toMatchSnapshot()
})
