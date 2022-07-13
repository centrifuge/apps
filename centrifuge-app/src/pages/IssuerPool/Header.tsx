import { Box, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams, useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { PageHeader } from '../../components/PageHeader'
import { PAGE_GUTTER } from '../../components/PageWithSideBar'
import { TextWithPlaceholder } from '../../components/TextWithPlaceholder'
import { parseMetadataUrl } from '../../utils/parseMetadataUrl'
import { useAddress } from '../../utils/useAddress'
import { usePermissions } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  actions?: React.ReactNode
}

export const IssuerPoolHeader: React.FC<Props> = ({ actions }) => {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const { data: metadata, isLoading } = usePoolMetadata(pool)
  const theme = useTheme()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''

  const address = useAddress()
  const permissions = usePermissions(address)
  if (!pool || !permissions) return null

  const configurePermission = permissions.pools[pid]?.roles.includes('PoolAdmin')

  const investPermission =
    permissions.pools[pid]?.roles.includes('PoolAdmin') || permissions.pools[pid]?.roles.includes('MemberListAdmin')

  return (
    <>
      <PageHeader
        title={
          <TextWithPlaceholder isLoading={isLoading}>{metadata?.pool?.name ?? 'Unnamed pool'}</TextWithPlaceholder>
        }
        subtitle={
          <TextWithPlaceholder isLoading={isLoading}>by {metadata?.pool?.issuer.name ?? 'Unknown'}</TextWithPlaceholder>
        }
        icon={
          metadata?.pool?.icon ? (
            <Box as="img" width="iconLarge" height="iconLarge" src={parseMetadataUrl(metadata?.pool?.icon)} />
          ) : (
            <Shelf
              width="iconLarge"
              height="iconLarge"
              borderRadius="card"
              backgroundColor={isLoading ? 'borderSecondary' : 'backgroundThumbnail'}
              justifyContent="center"
            >
              <Text variant="body1">{(isLoading ? '' : metadata?.pool?.name ?? 'U')[0]}</Text>
            </Shelf>
          )
        }
        border={false}
        actions={actions}
      >
        <Shelf
          px={PAGE_GUTTER}
          bg="backgroundPage"
          style={{
            boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          <NavigationTabs basePath={`${basePath}/${pid}`}>
            <NavigationTabsItem to={`${basePath}/${pid}`}>Overview</NavigationTabsItem>
            <NavigationTabsItem to={`${basePath}/${pid}/assets`}>Assets</NavigationTabsItem>
            <NavigationTabsItem to={`${basePath}/${pid}/liquidity`}>Liquidity</NavigationTabsItem>
            {investPermission && <NavigationTabsItem to={`${basePath}/${pid}/investors`}>Investors</NavigationTabsItem>}
            {configurePermission && (
              <NavigationTabsItem to={`${basePath}/${pid}/configuration`}>Configuration</NavigationTabsItem>
            )}
          </NavigationTabs>
        </Shelf>
      </PageHeader>
    </>
  )
}
