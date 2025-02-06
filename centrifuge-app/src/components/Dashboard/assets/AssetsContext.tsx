import { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useFormikContext } from 'formik'
import React, { ReactNode, createContext, useContext, useMemo, useState } from 'react'
import { LoanTemplate } from 'src/types'
import { useMetadataMulti } from 'src/utils/useMetadata'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor, useSuitableAccounts } from 'src/utils/usePermissions'
import { CreateAssetFormValues } from './CreateAssetsDrawer'
import { usePoolMetadataMap } from './utils'

export type Step = 'upload-template' | 'create-asset'
export type PoolWithMetadata = Pool & { meta: PoolMetadata }

interface AssetsContextProps {
  setType: React.Dispatch<React.SetStateAction<Step>>
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  open: boolean
  type: Step
  poolsMetadata: PoolWithMetadata[]
  selectedPool: PoolWithMetadata | undefined
  templatesMetadata: LoanTemplate[]
  canCreateAssets: boolean
  templatesData: LoanTemplate[]
}

const AssetsContext = createContext<AssetsContextProps | undefined>(undefined)

export const useAssetsContext = (): AssetsContextProps => {
  const context = useContext(AssetsContext)
  if (!context) {
    throw new Error('useAssetsContext must be used within a AssetsContextProvider')
  }
  return context
}

interface AssetsProviderProps {
  children: ReactNode
}

export const AssetsProvider = ({ children }: AssetsProviderProps) => {
  const form = useFormikContext<CreateAssetFormValues>()
  const { values } = form
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor() || []
  const metas = usePoolMetadataMap(pools || [])
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Step>('create-asset')

  const poolsMetadata = useMemo(() => {
    return pools?.map((pool) => {
      const meta = metas.get(pool.id)
      return {
        ...pool,
        meta,
      }
    })
  }, [pools, metas])

  const selectedPool = useMemo(
    () => poolsMetadata.find((pool) => pool.id === values.poolId),
    [poolsMetadata, values.poolId]
  )

  const canCreateAssets =
    useSuitableAccounts({ poolId: values.poolId, poolRole: ['Borrower'], proxyType: ['Borrow'] }).length > 0

  const templateIds = selectedPool?.meta?.loanTemplates?.map((s) => s.id)

  const templatesMetadataResults = useMetadataMulti<LoanTemplate>(templateIds ?? [])
  const templatesMetadata = templatesMetadataResults.map((result) => result.data).filter(Boolean) as LoanTemplate[]

  const templatesData = templateIds.map((id, i) => {
    const meta = templatesMetadata[i]?.data
    const metaMeta = selectedPool?.meta?.loanTemplates?.[i]
    return {
      id,
      name: meta?.name ?? `Version ${i + 1}`,
      createdAt: metaMeta?.createdAt ? new Date(metaMeta?.createdAt) : null,
      data: meta,
    }
  })

  return (
    <AssetsContext.Provider
      value={{
        setType,
        setOpen,
        open,
        type,
        poolsMetadata: poolsMetadata || [],
        selectedPool,
        templatesMetadata,
        canCreateAssets,
        templatesData,
      }}
    >
      {children}
    </AssetsContext.Provider>
  )
}
