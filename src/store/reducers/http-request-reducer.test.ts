import { httpRequestReducer } from './http-request-reducer';

type Animal = {
  name: string;
};

const ANIMAL_ACTION_TYPE = {
  start: 'start',
  success: 'success',
  fail: 'fail',
  clear: 'clear',
};

const reducer = httpRequestReducer<Animal>(ANIMAL_ACTION_TYPE);

describe('default', () => {
  it('should return the state unchanged', function() {
    const previousState = {
      loading: true,
      hasError: false,
      data: { name: 'sabretooth' },
      error: new Error('extinct species'),
    };
    const reducedResult = reducer(previousState, {
      type: 'IRRELEVANT_ACTION_TYPE',
    });
    expect(reducedResult).toEqual(previousState);
  });
});

describe('on start', () => {
  it('should reset the state and set loading', function() {
    const reducedResult = reducer(undefined, {
      type: ANIMAL_ACTION_TYPE.start,
      payload: undefined,
    });

    expect(reducedResult).toEqual({
      loading: true,
      hasError: false,
      data: undefined,
      error: undefined,
    });
  });
});

describe('on success', () => {
  it('should add the payload', function() {
    const reducedResult = reducer(undefined, {
      type: ANIMAL_ACTION_TYPE.success,
      payload: { name: 'yeti' },
    });

    expect(reducedResult).toEqual({
      loading: false,
      hasError: false,
      data: { name: 'yeti' },
      error: undefined,
    });
  });
});

describe('on fail', () => {
  it('should set the error', function() {
    const reducedResult = reducer(undefined, {
      type: ANIMAL_ACTION_TYPE.fail,
      payload: new Error('Something went wrong'),
    });

    expect(reducedResult).toEqual({
      loading: false,
      hasError: true,
      data: undefined,
      error: new Error('Something went wrong'),
    });
  });
});
