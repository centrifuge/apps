import { Shelf, Text } from '@centrifuge/fabric'
import styled from 'styled-components'

const Button = styled(Text)<{ isActive: boolean }>`
  appearance: none;
  border: 0;
  cursor: pointer;
  display: block;
  padding: 8px 16px;
  border-radius: 20px;

  color: ${({ theme, isActive }) => (isActive ? theme.colors.textInteractive : theme.colors.textPrimary)};
  box-shadow: ${({ theme, isActive }) => (isActive ? theme.shadows.cardInteractive : 'none')};
  background: ${({ theme, isActive }) => (isActive ? theme.colors.backgroundPage : 'transparent')};
`

type PoolsSwitchProps = {
  filtered: boolean
  setFiltered: (b: boolean) => void
}

export function PoolsSwitch({ filtered, setFiltered }: PoolsSwitchProps) {
  return (
    <Shelf gap={2}>
      <Text as="span" variant="interactive2">
        View pools
      </Text>
      <Shelf as="nav" bg="backgroundSecondary" borderRadius="20px" p="5px">
        <Button
          forwardedAs="button"
          variant="interactive2"
          isActive={filtered}
          type="button"
          onClick={() => setFiltered(true)}
        >
          Open for investment
        </Button>
        <Button
          forwardedAs="button"
          variant="interactive2"
          isActive={!filtered}
          type="button"
          onClick={() => setFiltered(false)}
        >
          All
        </Button>
      </Shelf>
    </Shelf>
  )
}
