import { sleep } from './sleep'

// waitUntil blocks until the provided (async) predicate evaluates to true by running it in a loop. It will fail if
// timeout is reached before the predicate succeded. The `option` argument can be used to overwrite the default interval
// (50 ms) timeout (30 s) and add a custom error message.
export function waitUntil(
  predicate: () => Promise<boolean>,
  options: { intervalMs?: number; timeoutMs?: number; errorMsg?: string } = {}
): Promise<void> {
  let { intervalMs, timeoutMs, errorMsg } = options
  intervalMs = intervalMs || 50
  timeoutMs = timeoutMs || 30 * 1000
  errorMsg = errorMsg || 'condition did not return true'

  const deadline = Date.now() + timeoutMs

  return new Promise(async (resolve, reject) => {
    while (true) {
      if (Date.now() > deadline) {
        reject(`waitUntil timed out after ${timeoutMs} ms: ${errorMsg}`)
        return
      }

      if (await predicate()) {
        resolve()
        return
      }

      sleep(intervalMs || 50)
    }
  })
}
