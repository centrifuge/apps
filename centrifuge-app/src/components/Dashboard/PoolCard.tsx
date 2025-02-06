import { Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Text, Thumbnail } from '@centrifuge/fabric'
import { useTheme } from 'styled-components'
import { usePoolMetadata } from '../../../src/utils/usePools'

export const PoolCard = ({
  children,
  active,
  onClick,
  pool,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  pool: Pool
}) => {
  const cent = useCentrifuge()
  const theme = useTheme()
  const { data: poolMetadata } = usePoolMetadata(pool)
  // TODO - remove cent usage
  const poolUri = poolMetadata?.pool?.icon?.uri
    ? cent.metadata.parseMetadataUrl(poolMetadata?.pool?.icon?.uri)
    : undefined
  return (
    <Box
      display="flex"
      backgroundColor={active ? theme.colors.backgroundInverted : theme.colors.backgroundSecondary}
      borderRadius={4}
      height="36px"
      padding="4px"
      alignItems="center"
      key={pool.id}
      justifyContent="space-between"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      mr={2}
      flexShrink={0}
    >
      <Box display="flex" alignItems="center">
        {poolUri ? (
          <Box as="img" src={poolUri} alt="" height={24} width={24} borderRadius={4} mr={1} />
        ) : (
          <Thumbnail type="pool" label="LP" size="small" />
        )}
        <Text variant="body2" color={active ? theme.colors.textInverted : theme.colors.textPrimary}>
          {poolMetadata?.pool?.name}
        </Text>
      </Box>
      <Box ml={2}>{children}</Box>
    </Box>
  )
}
