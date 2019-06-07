import { required } from './validators';

describe('required validator', () => {
  const errorMessage = 'That field is mandatory';
  it('should return error message when value is undefined', function() {
    expect(required(undefined)).toBe(errorMessage);
  });

  it('should return undefined when value is set', function() {
    expect(required('someValue')).toBe(undefined);
  });

  describe('when array', function() {
    it('should return error when empty', function() {
      expect(required([])).toBe(errorMessage);
    });

    it('should return undefined when not empty', function() {
      expect(required['someArrayValue']).toBe(undefined);
    });
  });
});
