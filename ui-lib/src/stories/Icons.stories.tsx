import { ComponentMeta } from '@storybook/react'
import React from 'react'
import * as icons from '../icon'

export default {
  title: 'Icons',
  //component: () => null,
} as ComponentMeta<React.FC>

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
