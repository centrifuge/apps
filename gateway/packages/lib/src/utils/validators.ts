export const isPasswordValid = (value:string) : boolean => {
  //Minimum eight characters, at least one lower case letter,one uppercase letter, one number and one special character
  const regexp = new RegExp("(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,32}$")
  return regexp.test(value);
}
