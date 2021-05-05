import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react'
import { Contact } from '@centrifuge/gateway-lib/models/contact'
import ContactList from './ContactList'
import { Preloader } from '../components/Preloader'
import { httpClient } from '../http-client'
import { AuthContext } from '../auth/Auth'
import { useMergeState } from '../hooks'
import { PageError } from '../components/PageError'
import { goToHomePage } from '../utils/goToHomePage'

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
  }, [displayPageError, setState, token])

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
