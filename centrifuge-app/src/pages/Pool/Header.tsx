import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { BASE_PADDING } from '../../components/LayoutBase/BasePadding'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { PageHeader } from '../../components/PageHeader'
import { useBasePath } from '../../utils/useBasePath'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  actions?: React.ReactNode
}

export function PoolDetailHeader({ actions }: Props) {
  const { pid } = useParams<{ pid: string }>()
  if (!pid) throw new Error('Pool not foud')
  const basePath = useBasePath()
  const { state } = useLocation()
  const pool = usePool(pid)
  const { data: metadata, isLoading } = usePoolMetadata(pool)
  const isTinlakePool = pool.id.startsWith('0x')
  const theme = useTheme()
  const cent = useCentrifuge()

  const iconUri = metadata?.pool?.icon?.uri && cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)

  return (
    <PageHeader
      title={<TextWithPlaceholder isLoading={isLoading}>{metadata?.pool?.name ?? 'Unnamed pool'}</TextWithPlaceholder>}
      parent={{ to: `/pools${state?.token ? '/tokens' : ''}`, label: state?.token ? 'Tokens' : 'Pools' }}
      icon={
        <>
          {metadata?.pool?.icon ? (
            <Box as="img" width="iconLarge" height="iconLarge" src={iconUri} borderRadius={4} />
          ) : (
            <Shelf
              width="iconLarge"
              height="iconLarge"
              borderRadius="card"
              backgroundColor={isLoading ? 'borderPrimary' : 'backgroundThumbnail'}
              justifyContent="center"
            >
              <Text variant="body1">{(isLoading ? '' : metadata?.pool?.name ?? 'U')[0]}</Text>
            </Shelf>
          )}
        </>
      }
      border={false}
      actions={actions}
    >
      <Shelf
        overflow="auto"
        px={BASE_PADDING}
        bg="backgroundPage"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderPrimary}`,
        }}
        color="textSelected"
      >
        <NavigationTabs>
          <NavigationTabsItem to={`${basePath}/${pid}`}>Overview</NavigationTabsItem>
          <NavigationTabsItem to={`${basePath}/${pid}/assets`}>Assets</NavigationTabsItem>
          <NavigationTabsItem to={`${basePath}/${pid}/liquidity`}>Liquidity</NavigationTabsItem>
          {!isTinlakePool && <NavigationTabsItem to={`${basePath}/${pid}/reporting`}>Reports</NavigationTabsItem>}
          {!isTinlakePool && <NavigationTabsItem to={`${basePath}/${pid}/data`}>Data</NavigationTabsItem>}
          {!isTinlakePool && <NavigationTabsItem to={`${basePath}/${pid}/fees`}>Fees</NavigationTabsItem>}
        </NavigationTabs>
      </Shelf>
    </PageHeader>
  )
}
