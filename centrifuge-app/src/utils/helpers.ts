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
