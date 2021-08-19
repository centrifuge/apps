import { Contact } from '@centrifuge/gateway-lib/models/contact'
import { Document } from '@centrifuge/gateway-lib/models/document'
import { FundingRequest, FundingSignatureRequest } from '@centrifuge/gateway-lib/models/funding-request'
import { MintNftRequest, TransferNftRequest } from '@centrifuge/gateway-lib/models/nfts'
import { Organization } from '@centrifuge/gateway-lib/models/organization'
import { Schema } from '@centrifuge/gateway-lib/models/schema'
import { TransferDetailsRequest } from '@centrifuge/gateway-lib/models/transfer-details'
import { LoggedInUser, User } from '@centrifuge/gateway-lib/models/user'
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants'
import axios, { AxiosInstance, AxiosPromise } from 'axios'
import * as React from 'react'
import { withRouter } from 'react-router'
import { RouteComponentProps } from 'react-router-dom'
import { AuthContext } from '../auth/Auth'
import routes from '../routes'

export function createHttpClient(instance: AxiosInstance = axios.create()) {
  return {
    user: {
      login: async (user: { email: string; password: string; token?: string }) =>
        instance.post<LoggedInUser>(ROUTES.USERS.login, user),
      profile: async (token: string) => instance.get<User>(ROUTES.USERS.profile, authHeader(token)),
      loginTentative: async (user: { email: string; password: string }) =>
        instance.post(ROUTES.USERS.loginTentative, user),
      register: async (user: User) => instance.post(ROUTES.USERS.base, user),
      invite: async (user: User, token: string) => instance.post(ROUTES.USERS.invite, user, authHeader(token)),
      update: async (user: User, token: string) => instance.put(ROUTES.USERS.base, user, authHeader(token)),
      delete: async (user: User, token: string) =>
        instance.delete(`${ROUTES.USERS.base}/${user._id}`, authHeader(token)),
      list: async (token: string) => instance.get(ROUTES.USERS.base, authHeader(token)),
    },
    contacts: {
      create: async (contact: Contact, token: string) => instance.post(ROUTES.CONTACTS, contact, authHeader(token)),
      list: async (token: string) => instance.get(ROUTES.CONTACTS, authHeader(token)),
      update: async (contact: Contact, token: string) =>
        instance.put(`${ROUTES.CONTACTS}/${contact._id}`, contact, authHeader(token)),
    },
    funding: {
      create: async (fundingRequest: FundingRequest, token: string) =>
        instance.post(ROUTES.FUNDING.base, fundingRequest, authHeader(token)),
      sign: async (fundingRequest: FundingSignatureRequest, token: string) =>
        instance.post(ROUTES.FUNDING.sign, fundingRequest, authHeader(token)),
    },
    transferDetails: {
      create: async (transferDetails: TransferDetailsRequest, token: string) =>
        instance.post(ROUTES.TRANSFER_DETAILS, transferDetails, authHeader(token)),
      update: async (transferDetails: TransferDetailsRequest, token: string) =>
        instance.put(`${ROUTES.TRANSFER_DETAILS}`, transferDetails, authHeader(token)),
    },
    schemas: {
      create: async (schema: Schema, token: string) => instance.post(ROUTES.SCHEMAS, schema, authHeader(token)),
      list: async (query = {}, token: string) =>
        instance.get(ROUTES.SCHEMAS, {
          params: { ...query },
          ...authHeader(token),
        }),
      getById: async (id: string, token: string): Promise<AxiosPromise<Schema>> =>
        instance.get(`${ROUTES.SCHEMAS}/${id}`, authHeader(token)),
      update: async (schema: Schema, token: string) =>
        instance.put(`${ROUTES.SCHEMAS}/${schema._id}`, schema, authHeader(token)),
      archive: async (id: string, token: string) =>
        instance.put(`${ROUTES.SCHEMAS}/${id}/archive`, undefined, authHeader(token)),
      restore: async (id: string, token: string) =>
        instance.put(`${ROUTES.SCHEMAS}/${id}/restore`, undefined, authHeader(token)),
    },
    documents: {
      create: async (document: Document, token: string) =>
        instance.post<Document>(ROUTES.DOCUMENTS, document, authHeader(token)),
      list: async (token: string) => instance.get(ROUTES.DOCUMENTS, authHeader(token)),
      getById: async (id, token: string): Promise<Document> =>
        instance.get(`${ROUTES.DOCUMENTS}/${id}`, authHeader(token)),
      update: async (document: Document, token: string) =>
        instance.put(`${ROUTES.DOCUMENTS}/${document._id}`, document, authHeader(token)),
      //TODO we should not use template as the document _id.
      clone: async (document: Document, token: string) =>
        instance.post<Document>(`${ROUTES.DOCUMENTS}/${document.template}/clone`, document, authHeader(token)),
      commit: async (id: string, token: string) =>
        instance.put(`${ROUTES.DOCUMENTS}/${id}/commit`, undefined, authHeader(token)),
    },
    nfts: {
      mint: async (payload: MintNftRequest, token: string) =>
        instance.post(`${ROUTES.NFTS}/mint`, payload, authHeader(token)),
      transfer: async (payload: TransferNftRequest, token: string) =>
        instance.post(`${ROUTES.NFTS}/transfer`, payload, authHeader(token)),
    },

    organizations: {
      create: async (organization: Organization, token: string) =>
        instance.post(ROUTES.ORGANIZATIONS, organization, authHeader(token)),
      list: async (token: string) => instance.get(ROUTES.ORGANIZATIONS, authHeader(token)),
      update: async (organization: Organization, token: string) =>
        instance.put(`${ROUTES.ORGANIZATIONS}/${organization._id}`, organization, authHeader(token)),
    },
  }
}

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

type HttpClientContextData = ReturnType<typeof createHttpClient>

const HttpClientContext = React.createContext<HttpClientContextData>({} as any)

export const useHttpClient = () => React.useContext(HttpClientContext)

type Props = {} & RouteComponentProps
const HttpClient: React.FC<Props> = ({ children, history }) => {
  const { setUser, setToken } = React.useContext(AuthContext)
  const ctx = React.useMemo(() => {
    const instance = axios.create()
    instance.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (error.response.status === 401) {
          setUser(null)
          setToken(null)
          history.push(routes.index, { initialError: 'logout' })
        }
        throw error
      }
    )
    return createHttpClient(instance)
  }, [history, setUser, setToken])

  return <HttpClientContext.Provider value={ctx}>{children}</HttpClientContext.Provider>
}

export default withRouter(HttpClient)
