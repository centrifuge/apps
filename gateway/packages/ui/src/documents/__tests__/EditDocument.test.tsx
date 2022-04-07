import { Modal } from '@centrifuge/axis-modal'
import { extendContactsWithUsers } from '@centrifuge/gateway-lib/models/contact'
import { DocumentStatus, NftStatus } from '@centrifuge/gateway-lib/models/document'
import { mount } from 'enzyme'
import { Heading, Paragraph } from 'grommet'
import { createMemoryHistory } from 'history'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { MemoryRouter } from 'react-router'
import { PageError } from '../../components/PageError'
import { Preloader } from '../../components/Preloader'
import { defaultContacts, defaultSchemas, defaultUser } from '../../test-utilities/default-data'
import { silenceConsoleWhen } from '../../test-utilities/silenceConsoleWhen'
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers'
import DocumentForm from '../DocumentForm'
import { EditDocument } from '../EditDocument'
import { Nfts } from '../Nfts'

jest.mock('../../http-client')
const httpClient = require('../../http-client').httpClient

const EditDocumentDynamicProps: any = EditDocument

describe('Edit Document', () => {
  const document = {
    nft_status: NftStatus.NoNft,
    document_status: DocumentStatus.Created,
    header: {
      write_access: [defaultUser.account],
      document_id: '0x1232314432199',
    },
    attributes: {
      ['_schema']: {
        key: '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'first_schema',
      },
    },
  }
  silenceConsoleWhen(/^Can not load (lists|contacts|document)$/)

  beforeEach(() => {
    httpClient.contacts.list.mockImplementation(async (data) => {
      return { data: defaultContacts }
    })

    httpClient.schemas.list.mockImplementation(async (data) => {
      return { data: defaultSchemas }
    })

    httpClient.documents.getById.mockImplementation(async (id) => {
      return {
        data: document,
      }
    })
  })

  it('Should render the preloader', async () => {
    const history = createMemoryHistory()

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          }
        )
      )

      const preloader = component.find(Preloader)
      // THe user has only one schema set
      expect(preloader.length).toEqual(1)
      expect(preloader.prop('message')).toEqual('Loading')
    })
  })

  it('Should load the data and render the page', async () => {
    const history = createMemoryHistory()

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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

      const extendedContacts = extendContactsWithUsers(defaultContacts, [defaultUser])
      // Edit does not filter schemas based on the user because
      // you should still edit a document you have even if you can not create a new one
      expect(documentForm.prop('schemas')).toEqual(defaultSchemas)
      expect(documentForm.prop('contacts')).toEqual(extendedContacts)
      expect(documentForm.prop('mode')).toEqual('edit')
      expect(documentForm.prop('selectedSchema')).toEqual(defaultSchemas[0])

      expect(documentForm.find(Nfts).prop('viewMode')).toBe(false)
    })
  })

  it('Should render an error if it fails to load schemas', async () => {
    const history = createMemoryHistory()

    const error = new Error('Can not load lists')
    httpClient.schemas.list.mockImplementation(async (data) => {
      throw error
    })

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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

    const history = createMemoryHistory()

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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

  it('Should render an error if it fails to load the document', async () => {
    const error = new Error('Can not load document')
    httpClient.documents.getById.mockImplementation(async (data) => {
      throw error
    })

    const history = createMemoryHistory()

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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

  it('Should update a document', async () => {
    httpClient.documents.create.mockImplementation(async (doc) => {
      return { data: doc }
    })
    httpClient.documents.commit.mockImplementation(async (id) => {
      return { data: id }
    })

    const history = createMemoryHistory()

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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
      documentForm.prop('onSubmit')(document)
      component.update()
      expect(component.find(Preloader).prop('message')).toEqual('Updating document')
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      expect(component.find(DocumentForm).length).toBe(1)
    })
  })

  it('Should fail to create a document', async () => {
    const history = createMemoryHistory()

    const error = {
      response: {
        data: {
          message: 'Document creation failed',
        },
      },
    }
    httpClient.documents.create.mockImplementation(async (data) => {
      throw error
    })

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <EditDocumentDynamicProps
              history={history}
              match={{
                params: {
                  id: '100',
                },
              }}
            />
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
      await documentForm.prop('onSubmit')(document)
      await new Promise((r) => setTimeout(r, 0))
      component.update()
      const alert = component.find(Modal)
      expect(alert.find(Heading).text()).toBe('Failed to update document')
      expect(alert.find(Paragraph).text()).toBe('Document creation failed')
    })
  })
})
