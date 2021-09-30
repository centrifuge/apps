import { ComponentMeta } from '@storybook/react'
import React from 'react'
import * as icons from '../icon'
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

export const Breakpoints = () => (
  <table>
    {Object.entries(bpAliases).map(([value, aliases]) => (
      <tr>
        <td>{aliases}</td>
        <td>{value}</td>
      </tr>
    ))}
  </table>
)

export const Colors = () => (
  <table>
    {Object.entries(theme.colors).map(([colorName, colorCode]) => (
      <tr>
        <td>{colorName}</td>
        <td>{colorCode}</td>
        <td style={{ minWidth: 50, backgroundColor: colorCode }}></td>
      </tr>
    ))}
  </table>
)

export const Spacing = () => (
  <table>
    {Object.entries(theme.space).map(([key, val]) => (
      <tr>
        <td>{key}</td>
        <td>{val}</td>

        <td>
          <div style={{ height: '1em', borderLeft: `${val}px solid grey` }}></div>
        </td>
      </tr>
    ))}
  </table>
)

export const Icons = () => (
  <table>
    {Object.entries(icons)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
      .map(([iconName, IconComponent]) => (
        <tr>
          <td>{iconName}</td>
          <td>
            <IconComponent />
          </td>
        </tr>
      ))}
  </table>
)
