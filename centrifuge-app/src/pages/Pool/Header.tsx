import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { PageHeader } from '../../components/PageHeader'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  actions?: React.ReactNode
}

export function PoolDetailHeader({ actions }: Props) {
  const { pid } = useParams<{ pid: string }>()
  if (!pid) throw new Error('Pool not foud')
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
        px={[2, 2, 2, 2, 5]}
        bg="backgroundPage"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderPrimary}`,
        }}
        color="textSelected"
      >
        <NavigationTabs>
          <NavigationTabsItem to={`/pools/${pid}`}>Overview</NavigationTabsItem>
          {!isTinlakePool && <NavigationTabsItem to={`/pools/${pid}/reporting`}>Reports</NavigationTabsItem>}
          {!isTinlakePool && <NavigationTabsItem to={`/pools/${pid}/data`}>Data</NavigationTabsItem>}
        </NavigationTabs>
      </Shelf>
    </PageHeader>
  )
}
