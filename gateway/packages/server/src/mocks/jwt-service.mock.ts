export class JwtServiceMock {
  sign = jest.fn(
    async (): Promise<string> => {
      return 'teststring'
    }
  )
}
