import { Contact } from '@centrifuge/gateway-lib/models/contact'
import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react'
import { AuthContext } from '../auth/Auth'
import { PageError } from '../components/PageError'
import { Preloader } from '../components/Preloader'
import { useMergeState } from '../hooks'
import { useHttpClient } from '../http-client'
import { goToHomePage } from '../utils/goToHomePage'
import ContactList from './ContactList'

type State = {
  loading: boolean
  error: any
  contacts: Contact[]
}

const ViewContacts: FunctionComponent = () => {
  const [{ loading, contacts, error }, setState] = useMergeState<State>({
    loading: true,
    error: null,
    contacts: [],
  })
  const httpClient = useHttpClient()
  const { user, token } = useContext(AuthContext)

  const displayPageError = useCallback(
    (error) => {
      setState({
        loading: false,
        error,
        contacts: [],
      })
    },
    [setState]
  )

  if (!token) {
    goToHomePage()
  }

  const createContact = async (contact: Contact) => {
    setState({
      loading: true,
    })
    try {
      await httpClient.contacts.create(contact, token!)
      await loadContacts()
    } catch (e) {
      displayPageError(e)
    }
  }

  const updateContact = async (contact: Contact) => {
    setState({
      loading: true,
    })
    try {
      await httpClient.contacts.update(contact, token!)
      await loadContacts()
    } catch (e) {
      displayPageError(e)
    }
  }

  const loadContacts = useCallback(async () => {
    setState({
      loading: true,
    })
    try {
      const contacts = (await httpClient.contacts.list(token!)).data
      setState({
        loading: false,
        contacts,
      })
    } catch (e) {
      displayPageError(e)
    }
  }, [displayPageError, httpClient, setState, token])

  useEffect(() => {
    loadContacts()
  }, [setState, loadContacts])

  if (loading) {
    return <Preloader message="Loading" />
  }

  if (error) return <PageError error={error} />

  return (
    <ContactList
      loggedInUser={user!}
      contacts={contacts as Contact[]}
      createContact={createContact}
      updateContact={updateContact}
    />
  )
}

export default ViewContacts
