import * as React from 'react'
import ControlPanel, { Checkbox, Select, Text } from 'react-control-panel'
import styled from 'styled-components'
import { FlagsState, initialFlagsState, useDebugFlags } from '.'
import { Box, Center } from '../Layout'
import { flagsConfig } from './config'
import { DebugFlagsContext, Key } from './context'

const DebugFlagsImpl: React.FC = ({ children }) => {
  const [state, setState] = React.useState(initialFlagsState)
  const [tracked, setTracked] = React.useState({})

  const ctx = React.useMemo(
    () => ({
      flags: Object.entries(state).reduce((obj, [key, value]) => {
        const conf = flagsConfig[key as Key]
        obj[key] = 'options' in conf ? conf.options[value as string] : value
        return obj
      }, {} as any),
      register(id: number, keys: string[]) {
        setTracked((prev) => ({ ...prev, [id]: keys }))
      },
      unregister(id: number) {
        setTracked((prev) => ({ ...prev, [id]: undefined }))
      },
    }),
    [state]
  )

  const usedKeys = new Set(Object.values(tracked).flat())

  return (
    <DebugFlagsContext.Provider value={ctx}>
      {children}
      <Panel
        state={state}
        usedKeys={usedKeys}
        onChange={(key: Key, val: any) => setState((prev) => ({ ...prev, [key]: val }))}
      />
    </DebugFlagsContext.Provider>
  )
}

const Panel: React.FC<{ state: FlagsState; usedKeys: Set<any>; onChange: (key: Key, val: any) => void }> = ({
  state,
  usedKeys,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false)
  const { showUnusedFlags } = useDebugFlags()
  return (
    <StyledPanel position="fixed" bottom={0} right={0}>
      <Center
        width={400}
        p="4px"
        as="button"
        type="button"
        onClick={() => setOpen(!open)}
        background="black"
        border="none"
        style={{ fontFamily: "'Hack', monospace", fontSize: '11px', color: 'white', cursor: 'pointer' }}
      >
        {open ? 'close' : 'open'} debug panel
      </Center>
      {open && (
        <ControlPanel state={state} onChange={onChange} width={400}>
          {Object.entries(flagsConfig).map(([key, obj]) => {
            let el
            if (obj.type === 'checkbox') {
              el = <Checkbox label={key} />
            } else if (obj.type === 'select' && 'options' in obj) {
              el = <Select label={key} options={Object.keys(obj.options)} />
            } else {
              el = <Text label={key} />
            }

            const used = usedKeys.has(key)

            return used || showUnusedFlags ? (
              <VisibilityWrapper visible={used} key={key}>
                {el}
              </VisibilityWrapper>
            ) : null
          })}
        </ControlPanel>
      )}
    </StyledPanel>
  )
}

const StyledPanel = styled(Box)`
  .control-panel {
    background: black !important;
    opacity: 1 !important;
  }
`

const VisibilityWrapper = styled.label<{ visible: boolean }>`
  pointer-events: ${(props) => (props.visible ? 'initial' : 'none')};

  div {
    opacity: ${(props) => (props.visible ? 1 : 0.6)};
  }

  input:checked + label {
    box-sizing: content-box;
    background-color: #eee !important;
  }
`

export default DebugFlagsImpl
