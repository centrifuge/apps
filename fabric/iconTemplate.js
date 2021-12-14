function iconTemplate({ template }, opts, { imports, interfaces, componentName, jsx, exports }) {
  jsx.openingElement.name.name = 'Svg'
  jsx.closingElement.name.name = 'Svg'

  const plugins = ['jsx']
  if (opts.typescript) {
    plugins.push('typescript')
  }
  const typeScriptTpl = template.smart({ plugins })

  return typeScriptTpl.ast`
${imports}
import styled from 'styled-components'
import { ResponsiveValue } from 'styled-system'
import css from '@styled-system/css'
import { Color, Size } from '../utils/types'

${interfaces}

type OwnProps = {
  size?: ResponsiveValue<Size>
  color?: ResponsiveValue<Color>
}

type Props = OwnProps & Omit<React.SVGProps<SVGSVGElement>, 'ref'>

const Svg = styled.svg<OwnProps>(props => css({
  width: props.size,
  height: props.size,
  color: props.color,
}))

function ${componentName}(props: Props) {
  return ${jsx}
}

${componentName}.defaultProps = {
  size: 'iconMedium',
  color: 'currentcolor',
}

${exports}
  `
}

module.exports = iconTemplate
