import { ThemeBreakpoints } from '../types'

const values = ['600px', '900px', '1200px', '1500px']

const breakpoints: ThemeBreakpoints = Object.assign(values, {
  S: values[0],
  M: values[1],
  L: values[2],
  XL: values[3],
})

export { breakpoints }
