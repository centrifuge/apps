import { Schema } from '@centrifuge/gateway-lib/models/schema'
import { mount } from 'enzyme'
import { Anchor, CheckBox, DataTable } from 'grommet'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { PageError } from '../../components/PageError'
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers'
import SchemaForm from '../SchemaForm'
import SchemaList from '../SchemaList'

describe('Schema List', () => {
  let httpClient

  const schemas = [
    {
      ...Schema.getDefaultValues(),
      name: 'first-schema',
    },
    {
      ...Schema.getDefaultValues(),
      name: 'second-schema',
    },
    {
      ...Schema.getDefaultValues(),
      name: 'third-schema',
      archived: true,
    },
  ]
  beforeEach(() => {
    httpClient = {
      schemas: { list: async () => ({ data: schemas }) },
    }
  })

  it('should display a page Error', async () => {
    await act(async () => {
      const error = new Error('Failed to load!')
      httpClient.schemas.list = async () => {
        throw error
      }
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()
      expect(component.find(PageError).prop('error')).toMatchObject(error)
    })
  })

  it('Should render 2 unarchived schemas with the propper actions', async () => {
    await act(async () => {
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()

      const dataTable = component.find(DataTable)
      expect(dataTable.length).toEqual(1)
      const rows = dataTable.find('tbody tr')
      expect(rows.length).toBe(2)
      const actions = rows.at(0).find(Anchor)
      expect(actions.at(0).text()).toEqual('View')
      expect(actions.at(1).text()).toEqual('Edit')
      expect(actions.at(2).text()).toEqual('Archive')
    })
  })

  it('Should switch to archived and render one item', async () => {
    await act(async () => {
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()

      component
        .find(CheckBox)
        .find('input')
        .simulate('change', { target: { value: true, checked: true } })

      const dataTable = component.find(DataTable)
      expect(dataTable.length).toEqual(1)
      const rows = dataTable.find('tbody tr')
      expect(rows.length).toBe(1)
      const actions = rows.at(0).find(Anchor)
      expect(actions.at(0).text()).toEqual('View')
      expect(actions.at(1).text()).toEqual('Restore')
    })
  })

  it('Should open schema modal when clicking view', async () => {
    await act(async () => {
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()

      const dataTable = component.find(DataTable)
      expect(dataTable.length).toEqual(1)
      const rows = dataTable.find('tbody tr')
      const actions = rows.at(0).find(Anchor)
      actions.at(0).simulate('click')
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const modal = component.find(SchemaForm)
      expect(modal.prop('readonly')).toBe(true)
      expect(modal.prop('submitLabel')).toBe('')
    })
  })

  it('Should open schema modal when clicking edit', async () => {
    await act(async () => {
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()

      const dataTable = component.find(DataTable)
      expect(dataTable.length).toEqual(1)
      const rows = dataTable.find('tbody tr')
      const actions = rows.at(0).find(Anchor)
      actions.at(1).simulate('click')
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const modal = component.find(SchemaForm)
      expect(modal.prop('readonly')).toBe(false)
      expect(modal.prop('submitLabel')).toBe('Update')
    })
  })

  it('Should open schema modal when clicking create', async () => {
    await act(async () => {
      const component = mount(withAllProvidersAndContexts(<SchemaList />, { httpClient }))

      await new Promise((r) => setTimeout(r, 0))
      component.update()

      const create = component.find({ label: 'Create Schema' }).find('button')
      create.simulate('click')
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const modal = component.find(SchemaForm)
      expect(modal.prop('readonly')).toBe(false)
      expect(modal.prop('submitLabel')).toBe('Create')
    })
  })
})
