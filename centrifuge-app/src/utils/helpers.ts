/**
 * Array.find gives a Typescript error when used on a union of different array types
 * This is a workaround to still have it be typed
 * @see https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgGLAF4eQbwLABQyxywAJgFzIgCuAtgEbQDchJyMmGVAzmFKADmrAgF9ChUJFiIUAIRpZcbEuSq1GLFcQaLuyPgJDDC4goQAUAbQC6yODzRdbyAD7IFWWwEoAdJxAyC2BIOmQAXgA+UlDfcm9mZCA
 * @see https://github.com/microsoft/TypeScript/issues/44373
 */
export function find<T extends Array<any>>(
  arr: T,
  predicate: (value: T[0], index: number, obj: T) => unknown
): T[0] | undefined {
  return arr.find(predicate as any)
}

export function looksLike(a: any, b: any): boolean {
  return isPrimitive(b)
    ? b === a
    : Object.keys(b).every((bKey) => {
        const bVal = b[bKey]
        const aVal = a?.[bKey]
        if (typeof bVal === 'function') {
          return bVal(aVal)
        }
        return looksLike(aVal, bVal)
      })
}

function isPrimitive(val: any): val is boolean | string | number | null | undefined {
  return val == null || /^[sbn]/.test(typeof val)
}
