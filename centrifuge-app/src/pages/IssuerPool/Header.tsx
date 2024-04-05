import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams, useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import { useDebugFlags } from '../../components/DebugFlags'
import { BASE_PADDING } from '../../components/LayoutBase/BasePadding'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { PageHeader } from '../../components/PageHeader'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function IssuerHeader({ actions, children }: Props) {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const { data: metadata, isLoading } = usePoolMetadata(pool)
  const cent = useCentrifuge()
  const theme = useTheme()

  return (
    <PageHeader
      title={<TextWithPlaceholder isLoading={isLoading}>{metadata?.pool?.name ?? 'Unnamed pool'}</TextWithPlaceholder>}
      subtitle={
        <TextWithPlaceholder isLoading={isLoading}>by {metadata?.pool?.issuer.name ?? 'Unknown'}</TextWithPlaceholder>
      }
      icon={
        metadata?.pool?.icon ? (
          <Box
            as="img"
            width="iconLarge"
            height="iconLarge"
            src={cent.metadata.parseMetadataUrl(metadata?.pool?.icon?.uri)}
          />
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
        px={BASE_PADDING}
        bg="backgroundPage"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        {children}
      </Shelf>
    </PageHeader>
  )
}

export function IssuerPoolHeader({ actions }: Props) {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
  const isTinlakePool = pool.id.startsWith('0x')
  const { showOracle } = useDebugFlags()

  return (
    <IssuerHeader>
      <NavigationTabs basePath={`${basePath}/${pid}`}>
        <NavigationTabsItem to={`${basePath}/${pid}`}>Overview</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/assets`}>Assets</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/liquidity`}>Liquidity</NavigationTabsItem>
        {!isTinlakePool && <NavigationTabsItem to={`${basePath}/${pid}/reporting`}>Reporting</NavigationTabsItem>}
        <NavigationTabsItem to={`${basePath}/${pid}/investors`}>Investors</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/configuration`}>Configuration</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/access`}>Access</NavigationTabsItem>
        {showOracle && <NavigationTabsItem to={`${basePath}/${pid}/pricing`}>Pricing</NavigationTabsItem>}
        <NavigationTabsItem to={`${basePath}/${pid}/fees`}>Fees</NavigationTabsItem>
      </NavigationTabs>
    </IssuerHeader>
  )
}
