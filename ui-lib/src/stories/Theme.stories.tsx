import { ComponentMeta } from '@storybook/react'
import React from 'react'
import { theme } from '../theme'

export default {
  title: 'Theme',
  //component: () => null,
} as ComponentMeta<React.FC>

export const Breakpoints = () => (
  <table>
    {Object.entries(theme.breakpoints).map(([key, val]) => (
      <tr>
        <td>{key}</td>
        <td>{val}</td>
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
