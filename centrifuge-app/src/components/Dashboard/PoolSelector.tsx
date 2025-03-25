import { Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Checkbox, Shelf, Text, Thumbnail } from '@centrifuge/fabric'
import { useEffect } from 'react'
import { useTheme } from 'styled-components'
import { useSelectedPools } from '../../utils/contexts/SelectedPoolsContext'
import { usePoolMetadata } from '../../utils/usePools'

export const PoolSelector = ({ multiple = true }: { multiple?: boolean }) => {
  const { pools, selectedPoolIds } = useSelectedPools(multiple)
  const theme = useTheme()
  return (
    <Shelf gap={0} overflowX="auto" borderBottom={multiple ? 'none' : `1px solid ${theme.colors.borderPrimary}`}>
      {pools?.map((pool) => (
        <PoolSelect key={pool.id} pool={pool} active={selectedPoolIds.includes(pool.id)} multiple={multiple} />
      ))}
    </Shelf>
  )
}

const PoolSelect = ({ pool, active, multiple }: { pool: Pool; active: boolean; multiple: boolean }) => {
  const cent = useCentrifuge()
  const { togglePoolIdSelection, selectedPoolIds, clearSelectedPoolsIds } = useSelectedPools(multiple)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const theme = useTheme()

  useEffect(() => {
    clearSelectedPoolsIds()
  }, [])

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
      borderBottom={!multiple && active ? `2px solid ${theme.colors.accentSecondary}` : 'none'}
      key={pool.id}
      justifyContent="space-between"
      style={{ cursor: 'pointer' }}
      mr={1}
      flexShrink={0}
      as="label"
      onClick={(e) => {
        e.stopPropagation()
        if (!multiple) {
          clearSelectedPoolsIds()
          togglePoolIdSelection(pool.id)
        }
      }}
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
      <Box ml={2}>
        {multiple ? (
          <Checkbox
            variant="secondary"
            onChange={() => togglePoolIdSelection(pool.id)}
            onClick={(e) => e.stopPropagation()}
            checked={selectedPoolIds.includes(pool.id)}
          />
        ) : null}
      </Box>
    </Box>
  )
}
