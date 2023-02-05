import { HttpsError } from './httpsError'

export const validateInput = async (input: any, schema: any) => {
  try {
    await schema.validate(input)
  } catch (error) {
    // @ts-expect-error error typing
    throw new HttpsError(400, error.message)
  }
}
