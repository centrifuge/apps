type MessageFilter = string | RegExp | ((e: any) => boolean)

export const silenceConsoleWhen = (...filters: MessageFilter[]) => {
  const origConsoleError = console.error

  beforeAll(() => {
    console.error = (e) => {
      const msg = e && e.message ? e.message : typeof e === 'string' ? e : ''
      for (let i = 0; i < filters.length; i += 1) {
        const filter = filters[i]

        if (
          (typeof filter === 'string' && msg.indexOf(filter) !== -1) ||
          (filter instanceof RegExp && msg.match(filter)) ||
          (typeof filter === 'function' && filter(e))
        ) {
          return
        }
      }
      origConsoleError(e)
    }
  })

  afterAll(() => {
    console.error = origConsoleError
  })
}
