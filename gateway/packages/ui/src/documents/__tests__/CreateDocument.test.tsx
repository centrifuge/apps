import { mount } from 'enzyme'
import { createMemoryHistory } from 'history'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { MemoryRouter, Router } from 'react-router'
import { PageError } from '../../components/PageError'
import { defaultContacts, defaultSchemas, defaultUser } from '../../test-utilities/default-data'
import { silenceConsoleWhen } from '../../test-utilities/silenceConsoleWhen'
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers'
import CreateDocument from '../CreateDocument'
import DocumentForm from '../DocumentForm'
import { Nfts } from '../Nfts'
import routes from '../routes'

jest.mock('../../http-client')
const httpClient = require('../../http-client').httpClient

describe('Create Document', () => {
  silenceConsoleWhen(/^Can not load (lists|contacts|document)$/, `document_id' of undefined`)

  beforeEach(() => {
    httpClient.contacts.list.mockImplementation(async (data) => {
      return { data: defaultContacts }
    })

    httpClient.schemas.list.mockImplementation(async (data) => {
      return { data: defaultSchemas }
    })
  })

  it('Should load the data and render the page', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <CreateDocument />
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          }
        )
      )

      //Wait for use effect and update the dom of the component
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const documentForm = component.find(DocumentForm)
      // THe user has only one schema set
      expect(documentForm.prop('schemas')).toEqual([defaultSchemas[0]])
      expect(documentForm.prop('mode')).toEqual('create')
      expect(documentForm.prop('contacts')).toEqual(defaultContacts)

      expect(documentForm.find(Nfts).length).toBe(0)
    })
  })

  it('Should render an error if it fails to load schemas', async () => {
    const error = new Error('Can not load lists')
    httpClient.schemas.list.mockImplementation(async (data) => {
      throw error
    })

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <CreateDocument />
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          }
        )
      )

      //Wait for use effect and update the dom of the component
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const pageError = component.find(PageError)
      // THe user has only one schema set
      expect(pageError.prop('error')).toEqual(error)
    })
  })

  it('Should render an error if it fails to load contacts', async () => {
    const error = new Error('Can not load contacts')
    httpClient.contacts.list.mockImplementation(async (data) => {
      throw error
    })

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <CreateDocument />
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          }
        )
      )

      //Wait for use effect and update the dom of the component
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const pageError = component.find(PageError)
      // THe user has only one schema set
      expect(pageError.prop('error')).toEqual(error)
    })
  })

  it('Should create a document', async () => {
    const history = createMemoryHistory()

    httpClient.documents.create.mockImplementation(async (data) => {
      return { data: { _id: 'new_document' } }
    })

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <Router history={history}>
            <CreateDocument />
          </Router>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          }
        )
      )

      //Wait for use effect and update the dom of the component
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const documentForm = component.find(DocumentForm)
      await documentForm.prop('onSubmit')({
        attributes: {},
      })
      component.update()
      expect(history.location.pathname).toBe(routes.index)
    })
  })

  // TODO: we silently fail right now if document creation fails
})
