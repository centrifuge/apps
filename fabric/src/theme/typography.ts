import breakpoints from './breakpoints'
import colors from './colors'

const mediaNonMobile = (css: string) => `
@media (min-width: ${breakpoints.small}) {
  ${css}
}
`

// TODO: double-check types on figma, including mobile versions

const types = {
  heading1: `
    font-size: 20px;
    line-height: 25px;
    font-weight: 500;
    color: ${colors.textPrimary};

    ${mediaNonMobile(`
      font-size: 24px;
      line-height: 30px;
      font-weight: 600;
    `)}
  `,
  heading2: `
    font-size: 20px;
    line-height: 25px;
    font-weight: 600;
    color: ${colors.textPrimary};
  `,
  heading3: `
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
    color: ${colors.textPrimary};
  `,
  heading4: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 500;
    color: ${colors.textPrimary};
  `,
  heading5: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 500;
    color: ${colors.textSecondary};
  `,
  heading6: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 600;
    color: ${colors.textSecondary};
  `,
  emphasized: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 600;
    color: ${colors.textPrimary};
  `,
  interactive: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 500;
    color: ${colors.textPrimary};
  `,
  interactive2: `
    font-size: 14px;
    line-height: 135.5%;
    font-weight: 500;
    color: ${colors.textSecondary};
  `,
  bodyLarge: `
    font-size: 16px;
    line-height: 125%;
    font-weight: 400;
    color: ${colors.textPrimary};
  `,
  body: `
    font-size: 14px;
    line-height: 125%;
    font-weight: 400;
    color: ${colors.textPrimary};
  `,
  label: `
    font-size: 12px;
    line-height: 16.5px;
    font-weight: 500;
    color: ${colors.textPrimary};
  `,
  formatLabel: `
    font-size: 10px;
    line-height: 12.5px;
    font-weight: 400;
    color: ${colors.textPrimary};
  `,
}

export default Object.entries(types).reduce((acc, [key, val]) => {
  acc[key] = `
  font-family: AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  ${val}`
  return acc
})
