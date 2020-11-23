const emailRegex = /\S+@\S+\.\S+/

export const isValidEmail = (email: string): boolean => {
  return emailRegex.test(email)
}
