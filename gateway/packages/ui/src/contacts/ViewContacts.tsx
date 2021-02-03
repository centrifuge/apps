import { Contact } from '@centrifuge/gateway-lib/models/contact'
import React, { FunctionComponent, useCallback, useContext, useEffect } from 'react'
import { AppContext } from '../App'
import { PageError } from '../components/PageError'
import { Preloader } from '../components/Preloader'
import { useMergeState } from '../hooks'
import { httpClient } from '../http-client'
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

  const { user } = useContext(AppContext)

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

  const createContact = async (contact: Contact) => {
    setState({
      loading: true,
    })
    try {
      await httpClient.contacts.create(contact)
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
      await httpClient.contacts.update(contact)
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
      const contacts = (await httpClient.contacts.list()).data
      setState({
        loading: false,
        contacts,
      })
    } catch (e) {
      displayPageError(e)
    }
  }, [displayPageError, setState])

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
