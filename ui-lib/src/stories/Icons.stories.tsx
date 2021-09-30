import { ComponentMeta } from '@storybook/react'
import React from 'react'
import styled from 'styled-components'
import * as icons from '../icon'

export default {
  title: 'Icons',
  //component: () => null,
} as ComponentMeta<React.FC>

export const Icons = () => (
  <Table>
    {Object.entries(icons)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
      .map(([iconName, IconComponent]) => (
        <tr>
          <td>{iconName}</td>
          <td>
            <IconComponent style={{ fontSize: 24, marginLeft: 24 }} />
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
