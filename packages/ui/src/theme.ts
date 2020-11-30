import {axisThemeConfig} from  '@centrifuge/axis-theme'
import { css } from 'styled-components'

export const theme = {
  ...axisThemeConfig,
  table: {

    ...axisThemeConfig.table,
    body: {
      ...axisThemeConfig.table.body,
      pad: {
        ...axisThemeConfig.table.body.pad,
        right:'12px'

      },
    }
  },
  dataTable: {
    ...axisThemeConfig.dataTable,
    body: {
      extend: css`
       tbody {
        td span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
       }
    `}
  }
}
