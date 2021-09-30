import { ComponentMeta } from '@storybook/react'
import React from 'react'
import styled from 'styled-components'
import { theme } from '../theme'

export default {
  title: 'Theme',
  //component: () => null,
} as ComponentMeta<React.FC>

const bpAliases = Object.entries(theme.breakpoints).reduce((acc, [key, value]) => {
  if (!acc[value]) {
    acc[value] = `${key}`
  } else {
    acc[value] += `, ${key}`
  }
  return acc
}, {} as Record<string, string>)

export const Breakpoints: React.FC = () => (
  <Table>
    {Object.entries(bpAliases).map(([value, aliases]) => (
      <tr key={value}>
        <td>{aliases}</td>
        <td>{value}</td>
      </tr>
    ))}
  </Table>
)

export const Colors: React.FC = () => (
  <Table>
    {Object.entries(theme.colors).map(([colorName, colorCode]) => (
      <tr key={colorName}>
        <td>{colorName}</td>
        <td>{colorCode}</td>
        <td style={{ minWidth: 50, backgroundColor: colorCode }}></td>
      </tr>
    ))}
  </Table>
)

export const Spacing: React.FC = () => (
  <Table>
    {Object.entries(theme.space).map(([key, val]) => (
      <tr key={key}>
        <td>{key}</td>
        <td>{val}</td>

        <td>
          <div style={{ height: '1em', borderLeft: `${val}px solid grey` }}></div>
        </td>
      </tr>
    ))}
  </Table>
)

const Table = styled.table`
  font-family: sans-serif;
  font-size: 16px;

  > tr > td {
    padding: 8px;
    border-bottom: 1px solid #dedede;
  }
`
