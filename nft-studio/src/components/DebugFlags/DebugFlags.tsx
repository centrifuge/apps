import { Box, Shelf, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { initialFlagsState, useDebugFlags } from '.'
import { flagsConfig } from './config'
import { DebugFlagsContext, Key } from './context'

const DebugFlagsImpl: React.FC = ({ children }) => {
  const [state, setState] = React.useState(initialFlagsState)
  const [tracked, setTracked] = React.useState({})

  const ctx = React.useMemo(
    () => ({
      flags: Object.entries(state).reduce((obj, [key, value]) => {
        const conf = flagsConfig[key as Key]
        obj[key] = conf?.options ? conf.options[value as string] : value
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
        usedKeys={usedKeys}
        onChange={(e: any) => setState((prev) => ({ ...prev, [e.target.name]: e.target.checked }))}
      />
    </DebugFlagsContext.Provider>
  )
}

const Panel: React.FC<{
  usedKeys: Set<any>
  onChange: (e: any) => any
}> = ({ usedKeys, onChange }) => {
  const [open, setOpen] = React.useState(false)
  const { showUnusedFlags, alwaysShowPanel } = useDebugFlags()

  React.useEffect(() => {
    if (alwaysShowPanel && !localStorage.getItem('debug')) {
      localStorage.setItem('debug', '1')
    }
    if (!alwaysShowPanel && localStorage.getItem('debug')) {
      localStorage.removeItem('debug')
    }
  }, [alwaysShowPanel])

  return (
    <StyledPanel position="fixed" bottom={0} right={0} zIndex={10}>
      <Shelf
        justifyContent="center"
        width="400px"
        padding="4px"
        as="button"
        type="button"
        onClick={() => setOpen(!open)}
        background="black"
        border="none"
        style={{ fontFamily: "'Hack', monospace", fontSize: '11px', color: 'white', cursor: 'pointer' }}
      >
        {open ? 'close' : 'open'} debug panel
      </Shelf>
      {open && (
        <StyledOpenPanel width={400} gap="1">
          {Object.entries(flagsConfig).map(([key, obj]) => {
            let el
            if (obj.type === 'checkbox') {
              el = <input type="checkbox" name={key} defaultChecked={!!obj.default} onChange={onChange} />
            } else if (obj.type === 'select' && obj.options) {
              el = (
                <select name={key} onChange={onChange}>
                  {Object.keys(obj.options).map((option) => (
                    <option value={option}>{option}</option>
                  ))}
                </select>
              )
            } else {
              el = <input onChange={onChange} type="text" color="#ddd" />
            }

            const used = usedKeys.has(key)

            return used || showUnusedFlags ? (
              <VisibilityWrapper id={key} visible={used || !!showUnusedFlags} key={key}>
                {key}
                {el}
              </VisibilityWrapper>
            ) : null
          })}
        </StyledOpenPanel>
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

const StyledOpenPanel = styled(Stack)`
  background: black;
  padding: 8px;
  color: white;
  font-family: Hack, monospace;
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
