export async function promiseAllObject<T = unknown>(promiseMap: Record<string, Promise<T>>) {
  const results = await Promise.all(Object.values(promiseMap))
  return Object.keys(promiseMap).reduce((resultMap, key, i) => {
    resultMap[key] = results[i]
    return resultMap
  }, {} as Record<string, T>)
}
