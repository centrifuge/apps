import { isPasswordValid } from '../validators';


describe('Validators', () => {

  it('Password validator', function() {
    expect(isPasswordValid('Password')).toBe(false);
    expect(isPasswordValid('Passwor')).toBe(false);
    expect(isPasswordValid('12345678')).toBe(false);
    expect(isPasswordValid('!@#$%^&*(')).toBe(false);
    expect(isPasswordValid('$Passw0rd')).toBe(true);
  });



});
