import { ResponsiveValue } from 'styled-system'

function isObject(value: any): value is object {
  return value != null && !Array.isArray(value) && typeof value === 'object'
}

export function mapResponsive<ResponsiveInput extends ResponsiveValue<any>, Output>(
  prop: ResponsiveInput,
  mapper: (v: any) => Output
): ResponsiveValue<Output> {
  if (Array.isArray(prop)) {
    return prop.map((item) => {
      if (item === null) {
        return null
      }
      return mapper(item)
    })
  }

  if (isObject(prop)) {
    return Object.entries(prop).reduce((result, [key, value]) => {
      result[key] = mapper(value)
      return result
    }, {} as any)
  }

  if (prop != null) {
    return mapper(prop)
  }

  return null
}
