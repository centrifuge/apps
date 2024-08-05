import { Meta } from '@storybook/react'
import * as React from 'react'
import styled from 'styled-components'
import { Text } from '..'
import * as icons from '../icon'

export default {
  title: 'Icons',
} as Meta<React.FC>

export function Icons() {
  return (
    <Table>
      {Object.entries(icons)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .map(([iconName, IconComponent]) => (
          <tr key={iconName}>
            <td>
              <Text>{iconName}</Text>
            </td>
            <td>
              <IconComponent color="textPrimary" />
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
