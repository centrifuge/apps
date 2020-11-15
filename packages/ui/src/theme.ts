import {axisThemeConfig} from  '@centrifuge/axis-theme'
import { css } from 'styled-components'

export const theme = {
  ...axisThemeConfig,
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
