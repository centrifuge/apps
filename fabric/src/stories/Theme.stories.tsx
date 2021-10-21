import { ComponentMeta } from '@storybook/react'
import React from 'react'
import styled, { useTheme } from 'styled-components'
import { Text } from '../components/Text'

export default {
  title: 'Theme',
} as ComponentMeta<React.FC>

export const Breakpoints: React.FC = () => {
  const theme = useTheme()
  const bpAliases = Object.entries(theme.breakpoints).reduce((acc, [key, value]) => {
    if (!acc[value]) {
      acc[value] = `${key}`
    } else {
      acc[value] += `, ${key}`
    }
    return acc
  }, {} as Record<string, string>)
  return (
    <Table>
      {Object.entries(bpAliases).map(([value, aliases]) => (
        <tr key={value}>
          <td>
            <Text>{aliases}</Text>
          </td>
          <td>
            <Text>{value}</Text>
          </td>
        </tr>
      ))}
    </Table>
  )
}

export const Colors: React.FC = () => {
  const theme = useTheme()
  return (
    <Table>
      {Object.entries(theme.colors)
        .filter(([, v]) => typeof v === 'string')
        .map(([colorName, colorCode]: [string, string]) => (
          <tr key={colorName}>
            <td>
              <Text>{colorName}</Text>
            </td>
            <td>
              <Text>{colorCode}</Text>
            </td>
            <td style={{ minWidth: 50, backgroundColor: colorCode }}></td>
          </tr>
        ))}
    </Table>
  )
}

export const Spacing: React.FC = () => {
  const theme = useTheme()
  return (
    <Table>
      {Object.entries(theme.space).map(([key, val]) => (
        <tr key={key}>
          <td>
            <Text>{key}</Text>
          </td>
          <td>
            <Text>{val}</Text>
          </td>

          <td>
            <div style={{ height: '1em', borderLeft: `${val}px solid grey` }}></div>
          </td>
        </tr>
      ))}
    </Table>
  )
}

const Table = styled.table`
  font-family: sans-serif;
  font-size: 16px;

  > tr > td {
    padding: 8px;
    border-bottom: 1px solid #dedede;
  }
`
