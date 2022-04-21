import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { initialFlagsState, useDebugFlags } from '.'
import { flagsConfig, Key } from './config'
import { DebugFlagsContext, FlagsState } from './context'

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

const Panel: React.FC<{
  state: FlagsState
  usedKeys: Set<any>
  onChange: (key: Key, val: any) => void
}> = ({ state, usedKeys, onChange }) => {
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
            const used = usedKeys.has(key)
            const value = state[key as Key]
            const visible = used || !!showUnusedFlags

            let el
            if (obj.type === 'checkbox') {
              el = (
                <input
                  type="checkbox"
                  name={key}
                  checked={value as boolean}
                  onChange={(e) => onChange(key as Key, e.target.checked)}
                  disabled={!used}
                />
              )
            } else if (obj.type === 'select' && obj.options) {
              el = (
                <select
                  name={key}
                  value={value as string}
                  onChange={(e) => onChange(key as Key, e.target.value)}
                  disabled={!used}
                >
                  {Object.keys(obj.options).map((option, index) => (
                    <option key={`${option}-${index}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )
            } else {
              el = (
                <input
                  value={value as string}
                  onChange={(e) => onChange(key as Key, e.target.value)}
                  type="text"
                  color="#ddd"
                  disabled={!used}
                />
              )
            }

            return visible ? (
              <Shelf
                as="label"
                justifyContent="space-between"
                key={key}
                style={{ pointerEvents: used ? 'initial' : 'none' }}
              >
                <Text
                  fontSize="inherit"
                  fontFamily="inherit"
                  color="white"
                  style={{ opacity: used ? 1 : 0.6, flex: '0 0 50%' }}
                >
                  {key}
                </Text>
                <Box flex="0 0 50%">{el}</Box>
              </Shelf>
            ) : null
          })}
        </StyledOpenPanel>
      )}
    </StyledPanel>
  )
}

const StyledPanel = styled(Box)``

const StyledOpenPanel = styled(Stack)`
  background: black;
  padding: 16px;
  color: white;
  font-family: Hack, monospace;
  font-size: 11px;
`

export default DebugFlagsImpl
