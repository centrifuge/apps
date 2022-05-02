import { Contact, extendContactsWithUsers } from '@centrifuge/gateway-lib/models/contact'
import { Document, documentIsEditable } from '@centrifuge/gateway-lib/models/document'
import { Schema } from '@centrifuge/gateway-lib/models/schema'
import { canWriteToDoc } from '@centrifuge/gateway-lib/models/user'
import { AxiosError } from 'axios'
import { Box, Button, Heading } from 'grommet'
import { LinkPrevious } from 'grommet-icons'
import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react'
import { Redirect, RouteComponentProps, withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { AuthContext } from '../auth/Auth'
import { NOTIFICATION, NotificationContext } from '../components/NotificationContext'
import { PageError } from '../components/PageError'
import { Preloader } from '../components/Preloader'
import { SecondaryHeader } from '../components/SecondaryHeader'
import { useMergeState } from '../hooks'
import { httpClient } from '../http-client'
import { goToHomePage } from '../utils/goToHomePage'
import DocumentForm from './DocumentForm'
import { Nfts } from './Nfts'
import documentRoutes from './routes'

type Props = RouteComponentProps<{ id: string }>

type State = {
  loadingMessage: string | null
  document?: Document
  schemas: Schema[]
  contacts: Contact[]
  error?: any
}

export const EditDocument: FunctionComponent<Props> = (props: Props) => {
  const {
    history: { push },
    match: {
      params: { id },
    },
  } = props
  const [{ loadingMessage, contacts, document, schemas, error }, setState] = useMergeState<State>({
    loadingMessage: 'Loading',
    schemas: [],
    contacts: [],
  })

  const { user, token } = useContext(AuthContext)
  const notification = useContext(NotificationContext)

  const displayPageError = useCallback(
    (error) => {
      setState({
        loadingMessage: null,
        error,
      })
    },
    [setState]
  )

  const loadData = useCallback(async () => {
    setState({
      loadingMessage: 'Loading',
    })
    try {
      const contacts = (await httpClient.contacts.list(token!)).data
      const schemas = (await httpClient.schemas.list(undefined, token!)).data
      const document = (await httpClient.documents.getById(id, token!)).data
      setState({
        loadingMessage: null,
        contacts,
        schemas,
        document,
      })
    } catch (e) {
      displayPageError(e)
    }
  }, [id, setState, displayPageError, token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateDocument = async (newDoc: Document) => {
    let document
    setState({
      loadingMessage: 'Updating document',
    })
    try {
      /*
       * We need to create a new version when updating a doc.
       * TODO this might need to change if we do not auto commit anymore
       * */
      newDoc.document_id = newDoc!.header!.document_id
      document = (await httpClient.documents.create(newDoc, token!)).data
      setState({
        loadingMessage: null,
        document,
      })
    } catch (e) {
      displayModalError(e, 'Failed to update document')
      return
    }

    try {
      await httpClient.documents.commit(document._id!, token!)
    } catch (e) {
      displayModalError(e, 'Failed to commit document')
    }
  }

  const startLoading = (loadingMessage: string = 'Loading') => {
    setState({ loadingMessage })
  }

  const returnToList = () => {
    push(documentRoutes.index)
  }

  const displayModalError = (e: AxiosError, title: string = 'Error') => {
    setState({
      loadingMessage: null,
    })
    notification.alert({
      type: NOTIFICATION.ERROR,
      title,
      message: e.response!.data!.message,
    })
  }

  const onCancel = () => {
    props.history.goBack()
  }

  if (!token) {
    goToHomePage()
  }

  if (loadingMessage) return <Preloader message={loadingMessage} />
  if (error) return <PageError error={error} />
  // Redirect to view when the user can not edit this document
  if (!canWriteToDoc(user!, document) || !documentIsEditable(document!))
    return <Redirect to={documentRoutes.view.replace(':id', id)} />

  const selectedSchema: Schema | undefined = schemas.find((s) => {
    return !!(
      document &&
      document.attributes &&
      document.attributes._schema &&
      s.name === document.attributes._schema.value
    )
  })

  if (!selectedSchema) return <PageError error={new Error('Can not find schema definition for document')} />

  // Add mint action if schema has any registries defined
  const canMint = selectedSchema!.registries && selectedSchema!.registries.length > 0
  const extendedContacts = extendContactsWithUsers(contacts, [user!])

  return (
    <>
      <DocumentForm
        onSubmit={updateDocument}
        selectedSchema={selectedSchema}
        mode={'edit'}
        contacts={extendedContacts}
        document={document}
        schemas={schemas}
        renderHeader={() => {
          return (
            <SecondaryHeader>
              <Box direction="row" gap="small" align="center">
                <Link to={documentRoutes.index}>
                  <LinkPrevious />
                </Link>
                <Heading level="3">{'Update Document'}</Heading>
              </Box>

              <Box direction="row" gap="medium">
                <Button onClick={onCancel} label="Discard" />
                <Button type="submit" primary label="Update" />
              </Box>
            </SecondaryHeader>
          )
        }}
      >
        <Nfts
          onAsyncStart={startLoading}
          onAsyncComplete={loadData}
          onAsyncError={displayModalError}
          onMintStart={returnToList}
          viewMode={!canMint}
          document={document!}
          contacts={contacts}
          template={selectedSchema!.template}
          registries={selectedSchema!.registries}
        />
      </DocumentForm>
    </>
  )
}

export default withRouter(EditDocument)
