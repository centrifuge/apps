import * as React from 'react'
import ControlPanel, { Checkbox, Select, Text } from 'react-control-panel'
import styled from 'styled-components'
import { Box, Center } from '../Layout'
import { flagsConfig } from './config'
import { DebugFlagsContext, defaultFlags, Flags, Key } from './context'

const DebugFlagsImpl: React.FC = ({ children }) => {
  const [state, setState] = React.useState<Flags>(defaultFlags)
  const [tracked, setTracked] = React.useState({})

  const ctx = React.useMemo(
    () => ({
      flags: Object.entries(state).reduce((obj, [key, value]) => {
        const conf = flagsConfig[key as Key]
        obj[key] = 'options' in conf ? (conf.options as any)[value] : value
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

  const visibleKeys = new Set(Object.values(tracked).flat())

  return (
    <DebugFlagsContext.Provider value={ctx}>
      {children}
      <Panel>
        <ControlPanel
          state={state}
          onChange={(key: Key, val: any) => setState((prev) => ({ ...prev, [key]: val }))}
          width={400}
        >
          {Object.entries(flagsConfig).map(([key, obj]) => {
            let el
            if (obj.type === 'checkbox') {
              el = <Checkbox label={key} />
            } else if (obj.type === 'select' && 'options' in obj) {
              el = <Select label={key} options={Object.keys(obj.options)} />
            } else {
              el = <Text label={key} />
            }

            return <VisibilityWrapper visible={visibleKeys.has(key)}>{el}</VisibilityWrapper>
          })}
        </ControlPanel>
      </Panel>
    </DebugFlagsContext.Provider>
  )
}

const Panel: React.FC = ({ children }) => {
  const [open, setOpen] = React.useState(true)
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
      {open && children}
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
  opacity: ${(props) => (props.visible ? 1 : 0.4)};
  pointer-events: ${(props) => (props.visible ? 'initial' : 'none')};

  .control-panel & input:checked + label {
    box-sizing: content-box;
    background-color: #eee !important;
  }
`

export default DebugFlagsImpl
