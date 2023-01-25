import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Flex, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation, useParams, useRouteMatch } from 'react-router'
import { useTheme } from 'styled-components'
import ethereumLogo from '../../assets/images/ethereum.svg'
import { useDebugFlags } from '../../components/DebugFlags'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { PageHeader } from '../../components/PageHeader'
import { PAGE_GUTTER } from '../../components/PageWithSideBar'
import { usePool, usePoolMetadata } from '../../utils/usePools'

type Props = {
  actions?: React.ReactNode
}

export const PoolDetailHeader: React.FC<Props> = ({ actions }) => {
  const { pid } = useParams<{ pid: string }>()
  const basePath = useRouteMatch(['/investments', '/issuer'])?.path || ''
  const { state } = useLocation<{ token: string }>()
  const pool = usePool(pid)
  const { data: metadata, isLoading } = usePoolMetadata(pool)
  const isTinlakePool = pool.id.startsWith('0x')
  const theme = useTheme()
  const cent = useCentrifuge()
  const { poolReporting } = useDebugFlags()

  return (
    <PageHeader
      title={<TextWithPlaceholder isLoading={isLoading}>{metadata?.pool?.name ?? 'Unnamed pool'}</TextWithPlaceholder>}
      subtitle={
        <TextWithPlaceholder isLoading={isLoading}>by {metadata?.pool?.issuer.name ?? 'Unknown'}</TextWithPlaceholder>
      }
      parent={{ to: `/investments${state?.token ? '/tokens' : ''}`, label: state?.token ? 'Tokens' : 'Pools' }}
      icon={
        <Flex position="relative">
          {metadata?.pool?.icon ? (
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
          )}
          {isTinlakePool && (
            <Shelf
              position="absolute"
              bottom={0}
              left={0}
              width={22}
              height={22}
              borderRadius="50%"
              background="white"
              style={{ transform: 'translate(-50%, 50%)' }}
            >
              <Box as="img" src={ethereumLogo} height={18} mx="auto" />
            </Shelf>
          )}
        </Flex>
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
        color="textSelected"
      >
        <NavigationTabs basePath={`${basePath}/${pid}`}>
          <NavigationTabsItem to={`${basePath}/${pid}`}>Overview</NavigationTabsItem>
          <NavigationTabsItem to={`${basePath}/${pid}/assets`}>Assets</NavigationTabsItem>
          {!isTinlakePool && <NavigationTabsItem to={`${basePath}/${pid}/liquidity`}>Liquidity</NavigationTabsItem>}
          {poolReporting && <NavigationTabsItem to={`${basePath}/${pid}/reporting`}>Reporting</NavigationTabsItem>}
        </NavigationTabs>
      </Shelf>
    </PageHeader>
  )
}
