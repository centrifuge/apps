import tinlakeSelectors from './tinlake'

/**
 * This is a fancy TS solution to support looking up selectors with strings like 'investmentsPage.tinInvest.investButton'
 * Source: https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object/58436959#58436959
 *
 * Syntax:
 *    selector('tinlake.investmentsPage.tinInvest.investButton')
 *
 * TODO: support nested selectors like this:
 *    const investmentsPage = selector('tinlake.investmentsPage')
 *    investmentsPage('tinInvest.investButton')
 *
 * TODO: exclude _path in Leaves type
 */
// type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//     11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

// type Join<K, P> = K extends string | number ?
//     P extends string | number ?
//     `${K}${"" extends P ? "" : "."}${P}`
//     : never : never;

// type Leaves<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
//     { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T] : "";

// TODO: any should be Leaves<typeof tinlakeSelectors>
export const selector = (path: any, selectors: typeof tinlakeSelectors) => {
  const elements = path.split('.')

  let concatenatedPath = ''
  let subObject = selectors
  for (let element of elements) {
    if ('_path' in subObject) concatenatedPath += (subObject as any)._path
    subObject = (subObject as any)[element]
  }

  // Add final leaf if it is a string.
  if (typeof subObject === 'string') {
    return concatenatedPath + subObject
  }

  // Otherwise, the path points to an object, so we add the `_path` if it exists, otherwise none.
  if ('_path' in subObject) {
    return concatenatedPath + (subObject as any)._path
  }

  return concatenatedPath
}

// TODO: any should be Leaves<typeof tinlakeSelectors>
export const tinlake = (path: any) => {
  return selector(path, tinlakeSelectors)
}
