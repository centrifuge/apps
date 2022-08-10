import { isSameAddress } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useAddress } from '../utils/useAddress'

const NodeAuthContext = React.createContext<{
  tokens: Record<string, Record<string, string | undefined>>
  setToken: (nodeUrl: string, address: string, token: string | undefined) => void
  login: (nodeUrl: string, address: string) => void
}>(null as any)

export const NodeAuthProvider: React.FC = ({ children }) => {
  const [tokens, setTokens] = React.useState<Record<string, Record<string, string | undefined>>>({}) // address => nodeUrl => token

  async function login(nodeUrl: string, address: string) {
    // Todo: request challenge from node, sign challenge, return signed message to node and receive token
    setTokens((prev) => ({ ...prev, [address]: { ...prev[address], [nodeUrl]: 'test' } }))
  }

  const ctx = React.useMemo(
    () => ({
      tokens,
      setToken: (nodeUrl: string, address: string, token: string | undefined) =>
        setTokens((prev) => ({ ...prev, [address]: { ...prev[address], [nodeUrl]: token } })),
      login,
    }),
    [tokens]
  )

  return <NodeAuthContext.Provider value={ctx}>{children}</NodeAuthContext.Provider>
}

export function useNodeAuth(nodeUrl: string | undefined) {
  const ctx = React.useContext(NodeAuthContext)
  const address = useAddress()
  const { data: nodeAccounts } = useQuery(
    ['nodeAccounts', nodeUrl],
    () => {
      // Todo: get from node
      return ['kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF']
    },
    {
      enabled: !!nodeUrl,
    }
  )
  if (!ctx) throw new Error('useNodeAuth must be used within NodeAuthProvider')
  const token = ctx.tokens[address ?? '']?.[nodeUrl ?? '']
  const hasValidToken = !!token // Todo: check if token expired
  const hasAccount = !!React.useMemo(
    () => address && nodeAccounts?.find((acc) => isSameAddress(acc, address)),
    [address, nodeAccounts]
  )
  return {
    tokens: ctx.tokens,
    token: hasValidToken ? token : null,
    login: ctx.login.bind(null, nodeUrl ?? '', address ?? ''),
    hasAccount,
    isLoggedIn: hasValidToken,
  }
}

const MOCK_DOCUMENT = {
  attributes: {
    label_5: {
      type: 'string',
      value: 'some text',
    },
    label_6: {
      type: 'number',
      value: 123.456,
    },
  },
  data: {
    schema: '',
  },
  document_id: '',
  read_access: ['string'],
  scheme: 'generic',
  write_access: ['string'],
}

export function useNodeDocument(nodeUrl: string | undefined, documentId: string | undefined) {
  const { token } = useNodeAuth(nodeUrl)

  const query = useQuery(
    ['nodeDocument', nodeUrl, documentId],
    () => {
      // Todo: get from node
      return MOCK_DOCUMENT
    },
    {
      enabled: !!nodeUrl && !!documentId && !!token,
    }
  )

  return query
}
