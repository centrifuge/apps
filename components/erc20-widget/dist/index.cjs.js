'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var styled = require('styled-components');
var styled__default = _interopDefault(styled);
var defaultProps$1 = require('grommet/default-props');
var grommet = require('grommet');
var themes = require('grommet/themes');
var object = require('grommet/utils/object');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var copyToClipboard = function copyToClipboard(value) {
  if (!document || !window) throw new Error('this only works in the Browser'); // if navigator and clipboard api exists

  if (window.navigator && window.navigator.clipboard) {
    return window.navigator.clipboard.writeText(value);
  }

  return new Promise(function (resolve, reject) {
    try {
      var textField = document.createElement('textarea');
      textField.innerText = value;
      document.body.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      textField.remove();
      resolve(value);
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
};

/*
 *      bignumber.js v9.0.0
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */
var isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    mathceil = Math.ceil,
    mathfloor = Math.floor,
    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',
    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,
    // 2^53 - 1
// MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,
    // EDITABLE
// The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
// the arguments to toExponential, toFixed, toFormat, and toPrecision.
MAX = 1E9; // 0 to MAX_INT32

/*
 * Create and return a BigNumber constructor.
 */

function clone(configObject) {
  var div,
      convertBase,
      parseNumeric,
      P = BigNumber.prototype = {
    constructor: BigNumber,
    toString: null,
    valueOf: null
  },
      ONE = new BigNumber(1),
      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------
  // The default values below must be integers within the inclusive ranges stated.
  // The values can also be changed at run-time using BigNumber.set.
  // The maximum number of decimal places for operations involving division.
  DECIMAL_PLACES = 20,
      // 0 to MAX
  // The rounding mode used when rounding to the above decimal places, and when using
  // toExponential, toFixed, toFormat and toPrecision, and round (default value).
  // UP         0 Away from zero.
  // DOWN       1 Towards zero.
  // CEIL       2 Towards +Infinity.
  // FLOOR      3 Towards -Infinity.
  // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
  // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
  // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
  // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
  // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
  ROUNDING_MODE = 4,
      // 0 to 8
  // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]
  // The exponent value at and beneath which toString returns exponential notation.
  // Number type: -7
  TO_EXP_NEG = -7,
      // 0 to -MAX
  // The exponent value at and above which toString returns exponential notation.
  // Number type: 21
  TO_EXP_POS = 21,
      // 0 to MAX
  // RANGE : [MIN_EXP, MAX_EXP]
  // The minimum exponent value, beneath which underflow to zero occurs.
  // Number type: -324  (5e-324)
  MIN_EXP = -1e7,
      // -1 to -MAX
  // The maximum exponent value, above which overflow to Infinity occurs.
  // Number type:  308  (1.7976931348623157e+308)
  // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
  MAX_EXP = 1e7,
      // 1 to MAX
  // Whether to use cryptographically-secure random number generation, if available.
  CRYPTO = false,
      // true or false
  // The modulo mode used when calculating the modulus: a mod n.
  // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
  // The remainder (r) is calculated as: r = a - n * q.
  //
  // UP        0 The remainder is positive if the dividend is negative, else is negative.
  // DOWN      1 The remainder has the same sign as the dividend.
  //             This modulo mode is commonly known as 'truncated division' and is
  //             equivalent to (a % n) in JavaScript.
  // FLOOR     3 The remainder has the same sign as the divisor (Python %).
  // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
  // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
  //             The remainder is always positive.
  //
  // The truncated division, floored division, Euclidian division and IEEE 754 remainder
  // modes are commonly used for the modulus operation.
  // Although the other rounding modes can also be used, they may not give useful results.
  MODULO_MODE = 1,
      // 0 to 9
  // The maximum number of significant digits of the result of the exponentiatedBy operation.
  // If POW_PRECISION is 0, there will be unlimited significant digits.
  POW_PRECISION = 0,
      // 0 to MAX
  // The format specification used by the BigNumber.prototype.toFormat method.
  FORMAT = {
    prefix: '',
    groupSize: 3,
    secondaryGroupSize: 0,
    groupSeparator: ',',
    decimalSeparator: '.',
    fractionGroupSize: 0,
    fractionGroupSeparator: '\xA0',
    // non-breaking space
    suffix: ''
  },
      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
  // '-', '.', whitespace, or repeated character.
  // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
  ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'; //------------------------------------------------------------------------------------------
  // CONSTRUCTOR

  /*
   * The BigNumber constructor and exported function.
   * Create and return a new instance of a BigNumber object.
   *
   * v {number|string|BigNumber} A numeric value.
   * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
   */

  function BigNumber(v, b) {
    var alphabet,
        c,
        caseChanged,
        e,
        i,
        isNum,
        len,
        str,
        x = this; // Enable constructor call without `new`.

    if (!(x instanceof BigNumber)) return new BigNumber(v, b);

    if (b == null) {
      if (v && v._isBigNumber === true) {
        x.s = v.s;

        if (!v.c || v.e > MAX_EXP) {
          x.c = x.e = null;
        } else if (v.e < MIN_EXP) {
          x.c = [x.e = 0];
        } else {
          x.e = v.e;
          x.c = v.c.slice();
        }

        return;
      }

      if ((isNum = typeof v == 'number') && v * 0 == 0) {
        // Use `1 / n` to handle minus zero also.
        x.s = 1 / v < 0 ? (v = -v, -1) : 1; // Fast path for integers, where n < 2147483648 (2**31).

        if (v === ~~v) {
          for (e = 0, i = v; i >= 10; i /= 10, e++);

          if (e > MAX_EXP) {
            x.c = x.e = null;
          } else {
            x.e = e;
            x.c = [v];
          }

          return;
        }

        str = String(v);
      } else {
        if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);
        x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
      } // Decimal point?


      if ((e = str.indexOf('.')) > -1) str = str.replace('.', ''); // Exponential form?

      if ((i = str.search(/e/i)) > 0) {
        // Determine exponent.
        if (e < 0) e = i;
        e += +str.slice(i + 1);
        str = str.substring(0, i);
      } else if (e < 0) {
        // Integer.
        e = str.length;
      }
    } else {
      // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
      intCheck(b, 2, ALPHABET.length, 'Base'); // Allow exponential notation to be used with base 10 argument, while
      // also rounding to DECIMAL_PLACES as with other bases.

      if (b == 10) {
        x = new BigNumber(v);
        return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
      }

      str = String(v);

      if (isNum = typeof v == 'number') {
        // Avoid potential interpretation of Infinity and NaN as base 44+ values.
        if (v * 0 != 0) return parseNumeric(x, str, isNum, b);
        x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1; // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'

        if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
          throw Error(tooManyDigits + v);
        }
      } else {
        x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
      }

      alphabet = ALPHABET.slice(0, b);
      e = i = 0; // Check that str is a valid base b number.
      // Don't use RegExp, so alphabet can contain special characters.

      for (len = str.length; i < len; i++) {
        if (alphabet.indexOf(c = str.charAt(i)) < 0) {
          if (c == '.') {
            // If '.' is not the first character and it has not be found before.
            if (i > e) {
              e = len;
              continue;
            }
          } else if (!caseChanged) {
            // Allow e.g. hexadecimal 'FF' as well as 'ff'.
            if (str == str.toUpperCase() && (str = str.toLowerCase()) || str == str.toLowerCase() && (str = str.toUpperCase())) {
              caseChanged = true;
              i = -1;
              e = 0;
              continue;
            }
          }

          return parseNumeric(x, String(v), isNum, b);
        }
      } // Prevent later check for length on converted number.


      isNum = false;
      str = convertBase(str, b, 10, x.s); // Decimal point?

      if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');else e = str.length;
    } // Determine leading zeros.


    for (i = 0; str.charCodeAt(i) === 48; i++); // Determine trailing zeros.


    for (len = str.length; str.charCodeAt(--len) === 48;);

    if (str = str.slice(i, ++len)) {
      len -= i; // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'

      if (isNum && BigNumber.DEBUG && len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
        throw Error(tooManyDigits + x.s * v);
      } // Overflow?


      if ((e = e - i - 1) > MAX_EXP) {
        // Infinity.
        x.c = x.e = null; // Underflow?
      } else if (e < MIN_EXP) {
        // Zero.
        x.c = [x.e = 0];
      } else {
        x.e = e;
        x.c = []; // Transform base
        // e is the base 10 exponent.
        // i is where to slice str to get the first element of the coefficient array.

        i = (e + 1) % LOG_BASE;
        if (e < 0) i += LOG_BASE; // i < 1

        if (i < len) {
          if (i) x.c.push(+str.slice(0, i));

          for (len -= LOG_BASE; i < len;) {
            x.c.push(+str.slice(i, i += LOG_BASE));
          }

          i = LOG_BASE - (str = str.slice(i)).length;
        } else {
          i -= len;
        }

        for (; i--; str += '0');

        x.c.push(+str);
      }
    } else {
      // Zero.
      x.c = [x.e = 0];
    }
  } // CONSTRUCTOR PROPERTIES


  BigNumber.clone = clone;
  BigNumber.ROUND_UP = 0;
  BigNumber.ROUND_DOWN = 1;
  BigNumber.ROUND_CEIL = 2;
  BigNumber.ROUND_FLOOR = 3;
  BigNumber.ROUND_HALF_UP = 4;
  BigNumber.ROUND_HALF_DOWN = 5;
  BigNumber.ROUND_HALF_EVEN = 6;
  BigNumber.ROUND_HALF_CEIL = 7;
  BigNumber.ROUND_HALF_FLOOR = 8;
  BigNumber.EUCLID = 9;
  /*
   * Configure infrequently-changing library-wide settings.
   *
   * Accept an object with the following optional properties (if the value of a property is
   * a number, it must be an integer within the inclusive range stated):
   *
   *   DECIMAL_PLACES   {number}           0 to MAX
   *   ROUNDING_MODE    {number}           0 to 8
   *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
   *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
   *   CRYPTO           {boolean}          true or false
   *   MODULO_MODE      {number}           0 to 9
   *   POW_PRECISION       {number}           0 to MAX
   *   ALPHABET         {string}           A string of two or more unique characters which does
   *                                     not contain '.'.
   *   FORMAT           {object}           An object with some of the following properties:
   *     prefix                 {string}
   *     groupSize              {number}
   *     secondaryGroupSize     {number}
   *     groupSeparator         {string}
   *     decimalSeparator       {string}
   *     fractionGroupSize      {number}
   *     fractionGroupSeparator {string}
   *     suffix                 {string}
   *
   * (The values assigned to the above FORMAT object properties are not checked for validity.)
   *
   * E.g.
   * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
   *
   * Ignore properties/parameters set to null or undefined, except for ALPHABET.
   *
   * Return an object with the properties current values.
   */

  BigNumber.config = BigNumber.set = function (obj) {
    var p, v;

    if (obj != null) {
      if (typeof obj == 'object') {
        // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
        // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
        if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
          v = obj[p];
          intCheck(v, 0, MAX, p);
          DECIMAL_PLACES = v;
        } // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
        // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'


        if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
          v = obj[p];
          intCheck(v, 0, 8, p);
          ROUNDING_MODE = v;
        } // EXPONENTIAL_AT {number|number[]}
        // Integer, -MAX to MAX inclusive or
        // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
        // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'


        if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
          v = obj[p];

          if (v && v.pop) {
            intCheck(v[0], -MAX, 0, p);
            intCheck(v[1], 0, MAX, p);
            TO_EXP_NEG = v[0];
            TO_EXP_POS = v[1];
          } else {
            intCheck(v, -MAX, MAX, p);
            TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
          }
        } // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
        // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
        // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'


        if (obj.hasOwnProperty(p = 'RANGE')) {
          v = obj[p];

          if (v && v.pop) {
            intCheck(v[0], -MAX, -1, p);
            intCheck(v[1], 1, MAX, p);
            MIN_EXP = v[0];
            MAX_EXP = v[1];
          } else {
            intCheck(v, -MAX, MAX, p);

            if (v) {
              MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
            } else {
              throw Error(bignumberError + p + ' cannot be zero: ' + v);
            }
          }
        } // CRYPTO {boolean} true or false.
        // '[BigNumber Error] CRYPTO not true or false: {v}'
        // '[BigNumber Error] crypto unavailable'


        if (obj.hasOwnProperty(p = 'CRYPTO')) {
          v = obj[p];

          if (v === !!v) {
            if (v) {
              if (typeof crypto != 'undefined' && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
                CRYPTO = v;
              } else {
                CRYPTO = !v;
                throw Error(bignumberError + 'crypto unavailable');
              }
            } else {
              CRYPTO = v;
            }
          } else {
            throw Error(bignumberError + p + ' not true or false: ' + v);
          }
        } // MODULO_MODE {number} Integer, 0 to 9 inclusive.
        // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'


        if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
          v = obj[p];
          intCheck(v, 0, 9, p);
          MODULO_MODE = v;
        } // POW_PRECISION {number} Integer, 0 to MAX inclusive.
        // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'


        if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
          v = obj[p];
          intCheck(v, 0, MAX, p);
          POW_PRECISION = v;
        } // FORMAT {object}
        // '[BigNumber Error] FORMAT not an object: {v}'


        if (obj.hasOwnProperty(p = 'FORMAT')) {
          v = obj[p];
          if (typeof v == 'object') FORMAT = v;else throw Error(bignumberError + p + ' not an object: ' + v);
        } // ALPHABET {string}
        // '[BigNumber Error] ALPHABET invalid: {v}'


        if (obj.hasOwnProperty(p = 'ALPHABET')) {
          v = obj[p]; // Disallow if only one character,
          // or if it contains '+', '-', '.', whitespace, or a repeated character.

          if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
            ALPHABET = v;
          } else {
            throw Error(bignumberError + p + ' invalid: ' + v);
          }
        }
      } else {
        // '[BigNumber Error] Object expected: {v}'
        throw Error(bignumberError + 'Object expected: ' + obj);
      }
    }

    return {
      DECIMAL_PLACES: DECIMAL_PLACES,
      ROUNDING_MODE: ROUNDING_MODE,
      EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
      RANGE: [MIN_EXP, MAX_EXP],
      CRYPTO: CRYPTO,
      MODULO_MODE: MODULO_MODE,
      POW_PRECISION: POW_PRECISION,
      FORMAT: FORMAT,
      ALPHABET: ALPHABET
    };
  };
  /*
   * Return true if v is a BigNumber instance, otherwise return false.
   *
   * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
   *
   * v {any}
   *
   * '[BigNumber Error] Invalid BigNumber: {v}'
   */


  BigNumber.isBigNumber = function (v) {
    if (!v || v._isBigNumber !== true) return false;
    if (!BigNumber.DEBUG) return true;
    var i,
        n,
        c = v.c,
        e = v.e,
        s = v.s;

    out: if ({}.toString.call(c) == '[object Array]') {
      if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {
        // If the first element is zero, the BigNumber value must be zero.
        if (c[0] === 0) {
          if (e === 0 && c.length === 1) return true;
          break out;
        } // Calculate number of digits that c[0] should have, based on the exponent.


        i = (e + 1) % LOG_BASE;
        if (i < 1) i += LOG_BASE; // Calculate number of digits of c[0].
        //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {

        if (String(c[0]).length == i) {
          for (i = 0; i < c.length; i++) {
            n = c[i];
            if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
          } // Last element cannot be zero, unless it is the only element.


          if (n !== 0) return true;
        }
      } // Infinity/NaN

    } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
      return true;
    }

    throw Error(bignumberError + 'Invalid BigNumber: ' + v);
  };
  /*
   * Return a new BigNumber whose value is the maximum of the arguments.
   *
   * arguments {number|string|BigNumber}
   */


  BigNumber.maximum = BigNumber.max = function () {
    return maxOrMin(arguments, P.lt);
  };
  /*
   * Return a new BigNumber whose value is the minimum of the arguments.
   *
   * arguments {number|string|BigNumber}
   */


  BigNumber.minimum = BigNumber.min = function () {
    return maxOrMin(arguments, P.gt);
  };
  /*
   * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
   * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
   * zeros are produced).
   *
   * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
   * '[BigNumber Error] crypto unavailable'
   */


  BigNumber.random = function () {
    var pow2_53 = 0x20000000000000; // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
    // Check if Math.random() produces more than 32 bits of randomness.
    // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
    // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.

    var random53bitInt = Math.random() * pow2_53 & 0x1fffff ? function () {
      return mathfloor(Math.random() * pow2_53);
    } : function () {
      return (Math.random() * 0x40000000 | 0) * 0x800000 + (Math.random() * 0x800000 | 0);
    };
    return function (dp) {
      var a,
          b,
          e,
          k,
          v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);
      if (dp == null) dp = DECIMAL_PLACES;else intCheck(dp, 0, MAX);
      k = mathceil(dp / LOG_BASE);

      if (CRYPTO) {
        // Browsers supporting crypto.getRandomValues.
        if (crypto.getRandomValues) {
          a = crypto.getRandomValues(new Uint32Array(k *= 2));

          for (; i < k;) {
            // 53 bits:
            // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
            // 11111 11111111 11111111 11111111 11100000 00000000 00000000
            // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
            //                                     11111 11111111 11111111
            // 0x20000 is 2^21.
            v = a[i] * 0x20000 + (a[i + 1] >>> 11); // Rejection sampling:
            // 0 <= v < 9007199254740992
            // Probability that v >= 9e15, is
            // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251

            if (v >= 9e15) {
              b = crypto.getRandomValues(new Uint32Array(2));
              a[i] = b[0];
              a[i + 1] = b[1];
            } else {
              // 0 <= v <= 8999999999999999
              // 0 <= (v % 1e14) <= 99999999999999
              c.push(v % 1e14);
              i += 2;
            }
          }

          i = k / 2; // Node.js supporting crypto.randomBytes.
        } else if (crypto.randomBytes) {
          // buffer
          a = crypto.randomBytes(k *= 7);

          for (; i < k;) {
            // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
            // 0x100000000 is 2^32, 0x1000000 is 2^24
            // 11111 11111111 11111111 11111111 11111111 11111111 11111111
            // 0 <= v < 9007199254740992
            v = (a[i] & 31) * 0x1000000000000 + a[i + 1] * 0x10000000000 + a[i + 2] * 0x100000000 + a[i + 3] * 0x1000000 + (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

            if (v >= 9e15) {
              crypto.randomBytes(7).copy(a, i);
            } else {
              // 0 <= (v % 1e14) <= 99999999999999
              c.push(v % 1e14);
              i += 7;
            }
          }

          i = k / 7;
        } else {
          CRYPTO = false;
          throw Error(bignumberError + 'crypto unavailable');
        }
      } // Use Math.random.


      if (!CRYPTO) {
        for (; i < k;) {
          v = random53bitInt();
          if (v < 9e15) c[i++] = v % 1e14;
        }
      }

      k = c[--i];
      dp %= LOG_BASE; // Convert trailing digits to zeros according to dp.

      if (k && dp) {
        v = POWS_TEN[LOG_BASE - dp];
        c[i] = mathfloor(k / v) * v;
      } // Remove trailing elements which are zero.


      for (; c[i] === 0; c.pop(), i--); // Zero?


      if (i < 0) {
        c = [e = 0];
      } else {
        // Remove leading elements which are zero and adjust exponent accordingly.
        for (e = -1; c[0] === 0; c.splice(0, 1), e -= LOG_BASE); // Count the digits of the first element of c to determine leading zeros, and...


        for (i = 1, v = c[0]; v >= 10; v /= 10, i++); // adjust the exponent accordingly.


        if (i < LOG_BASE) e -= LOG_BASE - i;
      }

      rand.e = e;
      rand.c = c;
      return rand;
    };
  }();
  /*
  * Return a BigNumber whose value is the sum of the arguments.
  *
  * arguments {number|string|BigNumber}
  */


  BigNumber.sum = function () {
    var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);

    for (; i < args.length;) sum = sum.plus(args[i++]);

    return sum;
  }; // PRIVATE FUNCTIONS
  // Called by BigNumber and BigNumber.prototype.toString.


  convertBase = function () {
    var decimal = '0123456789';
    /*
     * Convert string of baseIn to an array of numbers of baseOut.
     * Eg. toBaseOut('255', 10, 16) returns [15, 15].
     * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
     */

    function toBaseOut(str, baseIn, baseOut, alphabet) {
      var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

      for (; i < len;) {
        for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

        arr[0] += alphabet.indexOf(str.charAt(i++));

        for (j = 0; j < arr.length; j++) {
          if (arr[j] > baseOut - 1) {
            if (arr[j + 1] == null) arr[j + 1] = 0;
            arr[j + 1] += arr[j] / baseOut | 0;
            arr[j] %= baseOut;
          }
        }
      }

      return arr.reverse();
    } // Convert a numeric string of baseIn to a numeric string of baseOut.
    // If the caller is toString, we are converting from base 10 to baseOut.
    // If the caller is BigNumber, we are converting from baseIn to base 10.


    return function (str, baseIn, baseOut, sign, callerIsToString) {
      var alphabet,
          d,
          e,
          k,
          r,
          x,
          xc,
          y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE; // Non-integer.

      if (i >= 0) {
        k = POW_PRECISION; // Unlimited precision.

        POW_PRECISION = 0;
        str = str.replace('.', '');
        y = new BigNumber(baseIn);
        x = y.pow(str.length - i);
        POW_PRECISION = k; // Convert str as if an integer, then restore the fraction part by dividing the
        // result by its base raised to a power.

        y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'), 10, baseOut, decimal);
        y.e = y.c.length;
      } // Convert the number as integer.


      xc = toBaseOut(str, baseIn, baseOut, callerIsToString ? (alphabet = ALPHABET, decimal) : (alphabet = decimal, ALPHABET)); // xc now represents str as an integer and converted to baseOut. e is the exponent.

      e = k = xc.length; // Remove trailing zeros.

      for (; xc[--k] == 0; xc.pop()); // Zero?


      if (!xc[0]) return alphabet.charAt(0); // Does str represent an integer? If so, no need for the division.

      if (i < 0) {
        --e;
      } else {
        x.c = xc;
        x.e = e; // The sign is needed for correct rounding.

        x.s = sign;
        x = div(x, y, dp, rm, baseOut);
        xc = x.c;
        r = x.r;
        e = x.e;
      } // xc now represents str converted to baseOut.
      // THe index of the rounding digit.


      d = e + dp + 1; // The rounding digit: the digit to the right of the digit that may be rounded up.

      i = xc[d]; // Look at the rounding digits and mode to determine whether to round up.

      k = baseOut / 2;
      r = r || d < 0 || xc[d + 1] != null;
      r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : i > k || i == k && (rm == 4 || r || rm == 6 && xc[d - 1] & 1 || rm == (x.s < 0 ? 8 : 7)); // If the index of the rounding digit is not greater than zero, or xc represents
      // zero, then the result of the base conversion is zero or, if rounding up, a value
      // such as 0.00001.

      if (d < 1 || !xc[0]) {
        // 1^-dp or 0
        str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
      } else {
        // Truncate xc to the required number of decimal places.
        xc.length = d; // Round up?

        if (r) {
          // Rounding up may mean the previous digit has to be rounded up and so on.
          for (--baseOut; ++xc[--d] > baseOut;) {
            xc[d] = 0;

            if (!d) {
              ++e;
              xc = [1].concat(xc);
            }
          }
        } // Determine trailing zeros.


        for (k = xc.length; !xc[--k];); // E.g. [4, 11, 15] becomes 4bf.


        for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++])); // Add leading zeros, decimal point and trailing zeros as required.


        str = toFixedPoint(str, e, alphabet.charAt(0));
      } // The caller will add the sign.


      return str;
    };
  }(); // Perform division in the specified base. Called by div and convertBase.


  div = function () {
    // Assume non-zero x and k.
    function multiply(x, k, base) {
      var m,
          temp,
          xlo,
          xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

      for (x = x.slice(); i--;) {
        xlo = x[i] % SQRT_BASE;
        xhi = x[i] / SQRT_BASE | 0;
        m = khi * xlo + xhi * klo;
        temp = klo * xlo + m % SQRT_BASE * SQRT_BASE + carry;
        carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
        x[i] = temp % base;
      }

      if (carry) x = [carry].concat(x);
      return x;
    }

    function compare(a, b, aL, bL) {
      var i, cmp;

      if (aL != bL) {
        cmp = aL > bL ? 1 : -1;
      } else {
        for (i = cmp = 0; i < aL; i++) {
          if (a[i] != b[i]) {
            cmp = a[i] > b[i] ? 1 : -1;
            break;
          }
        }
      }

      return cmp;
    }

    function subtract(a, b, aL, base) {
      var i = 0; // Subtract b from a.

      for (; aL--;) {
        a[aL] -= i;
        i = a[aL] < b[aL] ? 1 : 0;
        a[aL] = i * base + a[aL] - b[aL];
      } // Remove leading zeros.


      for (; !a[0] && a.length > 1; a.splice(0, 1));
    } // x: dividend, y: divisor.


    return function (x, y, dp, rm, base) {
      var cmp,
          e,
          i,
          more,
          n,
          prod,
          prodL,
          q,
          qc,
          rem,
          remL,
          rem0,
          xi,
          xL,
          yc0,
          yL,
          yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c; // Either NaN, Infinity or 0?

      if (!xc || !xc[0] || !yc || !yc[0]) {
        return new BigNumber( // Return NaN if either NaN, or both Infinity or 0.
        !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN : // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
        xc && xc[0] == 0 || !yc ? s * 0 : s / 0);
      }

      q = new BigNumber(s);
      qc = q.c = [];
      e = x.e - y.e;
      s = dp + e + 1;

      if (!base) {
        base = BASE;
        e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
        s = s / LOG_BASE | 0;
      } // Result exponent may be one less then the current value of e.
      // The coefficients of the BigNumbers from convertBase may have trailing zeros.


      for (i = 0; yc[i] == (xc[i] || 0); i++);

      if (yc[i] > (xc[i] || 0)) e--;

      if (s < 0) {
        qc.push(1);
        more = true;
      } else {
        xL = xc.length;
        yL = yc.length;
        i = 0;
        s += 2; // Normalise xc and yc so highest order digit of yc is >= base / 2.

        n = mathfloor(base / (yc[0] + 1)); // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
        // if (n > 1 || n++ == 1 && yc[0] < base / 2) {

        if (n > 1) {
          yc = multiply(yc, n, base);
          xc = multiply(xc, n, base);
          yL = yc.length;
          xL = xc.length;
        }

        xi = yL;
        rem = xc.slice(0, yL);
        remL = rem.length; // Add zeros to make remainder as long as divisor.

        for (; remL < yL; rem[remL++] = 0);

        yz = yc.slice();
        yz = [0].concat(yz);
        yc0 = yc[0];
        if (yc[1] >= base / 2) yc0++; // Not necessary, but to prevent trial digit n > base, when using base 3.
        // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

        do {
          n = 0; // Compare divisor and remainder.

          cmp = compare(yc, rem, yL, remL); // If divisor < remainder.

          if (cmp < 0) {
            // Calculate trial digit, n.
            rem0 = rem[0];
            if (yL != remL) rem0 = rem0 * base + (rem[1] || 0); // n is how many times the divisor goes into the current remainder.

            n = mathfloor(rem0 / yc0); //  Algorithm:
            //  product = divisor multiplied by trial digit (n).
            //  Compare product and remainder.
            //  If product is greater than remainder:
            //    Subtract divisor from product, decrement trial digit.
            //  Subtract product from remainder.
            //  If product was less than remainder at the last compare:
            //    Compare new remainder and divisor.
            //    If remainder is greater than divisor:
            //      Subtract divisor from remainder, increment trial digit.

            if (n > 1) {
              // n may be > base only when base is 3.
              if (n >= base) n = base - 1; // product = divisor * trial digit.

              prod = multiply(yc, n, base);
              prodL = prod.length;
              remL = rem.length; // Compare product and remainder.
              // If product > remainder then trial digit n too high.
              // n is 1 too high about 5% of the time, and is not known to have
              // ever been more than 1 too high.

              while (compare(prod, rem, prodL, remL) == 1) {
                n--; // Subtract divisor from product.

                subtract(prod, yL < prodL ? yz : yc, prodL, base);
                prodL = prod.length;
                cmp = 1;
              }
            } else {
              // n is 0 or 1, cmp is -1.
              // If n is 0, there is no need to compare yc and rem again below,
              // so change cmp to 1 to avoid it.
              // If n is 1, leave cmp as -1, so yc and rem are compared again.
              if (n == 0) {
                // divisor < remainder, so n must be at least 1.
                cmp = n = 1;
              } // product = divisor


              prod = yc.slice();
              prodL = prod.length;
            }

            if (prodL < remL) prod = [0].concat(prod); // Subtract product from remainder.

            subtract(rem, prod, remL, base);
            remL = rem.length; // If product was < remainder.

            if (cmp == -1) {
              // Compare divisor and new remainder.
              // If divisor < new remainder, subtract divisor from remainder.
              // Trial digit n too low.
              // n is 1 too low about 5% of the time, and very rarely 2 too low.
              while (compare(yc, rem, yL, remL) < 1) {
                n++; // Subtract divisor from remainder.

                subtract(rem, yL < remL ? yz : yc, remL, base);
                remL = rem.length;
              }
            }
          } else if (cmp === 0) {
            n++;
            rem = [0];
          } // else cmp === 1 and n will be 0
          // Add the next digit, n, to the result array.


          qc[i++] = n; // Update the remainder.

          if (rem[0]) {
            rem[remL++] = xc[xi] || 0;
          } else {
            rem = [xc[xi]];
            remL = 1;
          }
        } while ((xi++ < xL || rem[0] != null) && s--);

        more = rem[0] != null; // Leading zero?

        if (!qc[0]) qc.splice(0, 1);
      }

      if (base == BASE) {
        // To calculate q.e, first get the number of digits of qc[0].
        for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

        round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more); // Caller is convertBase.
      } else {
        q.e = e;
        q.r = +more;
      }

      return q;
    };
  }();
  /*
   * Return a string representing the value of BigNumber n in fixed-point or exponential
   * notation rounded to the specified decimal places or significant digits.
   *
   * n: a BigNumber.
   * i: the index of the last digit required (i.e. the digit that may be rounded up).
   * rm: the rounding mode.
   * id: 1 (toExponential) or 2 (toPrecision).
   */


  function format(n, i, rm, id) {
    var c0, e, ne, len, str;
    if (rm == null) rm = ROUNDING_MODE;else intCheck(rm, 0, 8);
    if (!n.c) return n.toString();
    c0 = n.c[0];
    ne = n.e;

    if (i == null) {
      str = coeffToString(n.c);
      str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS) ? toExponential(str, ne) : toFixedPoint(str, ne, '0');
    } else {
      n = round(new BigNumber(n), i, rm); // n.e may have changed if the value was rounded up.

      e = n.e;
      str = coeffToString(n.c);
      len = str.length; // toPrecision returns exponential notation if the number of significant digits
      // specified is less than the number of digits necessary to represent the integer
      // part of the value in fixed-point notation.
      // Exponential notation.

      if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {
        // Append zeros?
        for (; len < i; str += '0', len++);

        str = toExponential(str, e); // Fixed-point notation.
      } else {
        i -= ne;
        str = toFixedPoint(str, e, '0'); // Append zeros?

        if (e + 1 > len) {
          if (--i > 0) for (str += '.'; i--; str += '0');
        } else {
          i += e - len;

          if (i > 0) {
            if (e + 1 == len) str += '.';

            for (; i--; str += '0');
          }
        }
      }
    }

    return n.s < 0 && c0 ? '-' + str : str;
  } // Handle BigNumber.max and BigNumber.min.


  function maxOrMin(args, method) {
    var n,
        i = 1,
        m = new BigNumber(args[0]);

    for (; i < args.length; i++) {
      n = new BigNumber(args[i]); // If any number is NaN, return NaN.

      if (!n.s) {
        m = n;
        break;
      } else if (method.call(m, n)) {
        m = n;
      }
    }

    return m;
  }
  /*
   * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
   * Called by minus, plus and times.
   */


  function normalise(n, c, e) {
    var i = 1,
        j = c.length; // Remove trailing zeros.

    for (; !c[--j]; c.pop()); // Calculate the base 10 exponent. First get the number of digits of c[0].


    for (j = c[0]; j >= 10; j /= 10, i++); // Overflow?


    if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {
      // Infinity.
      n.c = n.e = null; // Underflow?
    } else if (e < MIN_EXP) {
      // Zero.
      n.c = [n.e = 0];
    } else {
      n.e = e;
      n.c = c;
    }

    return n;
  } // Handle values that fail the validity test in BigNumber.


  parseNumeric = function () {
    var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
    return function (x, str, isNum, b) {
      var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, ''); // No exception on ±Infinity or NaN.

      if (isInfinityOrNaN.test(s)) {
        x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
      } else {
        if (!isNum) {
          // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
          s = s.replace(basePrefix, function (m, p1, p2) {
            base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
            return !b || b == base ? p1 : m;
          });

          if (b) {
            base = b; // E.g. '1.' to '1', '.1' to '0.1'

            s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
          }

          if (str != s) return new BigNumber(s, base);
        } // '[BigNumber Error] Not a number: {n}'
        // '[BigNumber Error] Not a base {b} number: {n}'


        if (BigNumber.DEBUG) {
          throw Error(bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
        } // NaN


        x.s = null;
      }

      x.c = x.e = null;
    };
  }();
  /*
   * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
   * If r is truthy, it is known that there are more digits after the rounding digit.
   */


  function round(x, sd, rm, r) {
    var d,
        i,
        j,
        k,
        n,
        ni,
        rd,
        xc = x.c,
        pows10 = POWS_TEN; // if x is not Infinity or NaN...

    if (xc) {
      // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
      // n is a base 1e14 number, the value of the element of array x.c containing rd.
      // ni is the index of n within x.c.
      // d is the number of digits of n.
      // i is the index of rd within n including leading zeros.
      // j is the actual index of rd within n (if < 0, rd is a leading zero).
      out: {
        // Get the number of digits of the first element of xc.
        for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);

        i = sd - d; // If the rounding digit is in the first element of xc...

        if (i < 0) {
          i += LOG_BASE;
          j = sd;
          n = xc[ni = 0]; // Get the rounding digit at index j of n.

          rd = n / pows10[d - j - 1] % 10 | 0;
        } else {
          ni = mathceil((i + 1) / LOG_BASE);

          if (ni >= xc.length) {
            if (r) {
              // Needed by sqrt.
              for (; xc.length <= ni; xc.push(0));

              n = rd = 0;
              d = 1;
              i %= LOG_BASE;
              j = i - LOG_BASE + 1;
            } else {
              break out;
            }
          } else {
            n = k = xc[ni]; // Get the number of digits of n.

            for (d = 1; k >= 10; k /= 10, d++); // Get the index of rd within n.


            i %= LOG_BASE; // Get the index of rd within n, adjusted for leading zeros.
            // The number of leading zeros of n is given by LOG_BASE - d.

            j = i - LOG_BASE + d; // Get the rounding digit at index j of n.

            rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
          }
        }

        r = r || sd < 0 || // Are there any non-zero digits after the rounding digit?
        // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
        // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
        xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);
        r = rm < 4 ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
        (i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));

        if (sd < 1 || !xc[0]) {
          xc.length = 0;

          if (r) {
            // Convert sd to decimal places.
            sd -= x.e + 1; // 1, 0.1, 0.01, 0.001, 0.0001 etc.

            xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
            x.e = -sd || 0;
          } else {
            // Zero.
            xc[0] = x.e = 0;
          }

          return x;
        } // Remove excess digits.


        if (i == 0) {
          xc.length = ni;
          k = 1;
          ni--;
        } else {
          xc.length = ni + 1;
          k = pows10[LOG_BASE - i]; // E.g. 56700 becomes 56000 if 7 is the rounding digit.
          // j > 0 means i > number of leading zeros of n.

          xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
        } // Round up?


        if (r) {
          for (;;) {
            // If the digit to be rounded up is in the first element of xc...
            if (ni == 0) {
              // i will be the length of xc[0] before k is added.
              for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);

              j = xc[0] += k;

              for (k = 1; j >= 10; j /= 10, k++); // if i != k the length has increased.


              if (i != k) {
                x.e++;
                if (xc[0] == BASE) xc[0] = 1;
              }

              break;
            } else {
              xc[ni] += k;
              if (xc[ni] != BASE) break;
              xc[ni--] = 0;
              k = 1;
            }
          }
        } // Remove trailing zeros.


        for (i = xc.length; xc[--i] === 0; xc.pop());
      } // Overflow? Infinity.


      if (x.e > MAX_EXP) {
        x.c = x.e = null; // Underflow? Zero.
      } else if (x.e < MIN_EXP) {
        x.c = [x.e = 0];
      }
    }

    return x;
  }

  function valueOf(n) {
    var str,
        e = n.e;
    if (e === null) return n.toString();
    str = coeffToString(n.c);
    str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(str, e) : toFixedPoint(str, e, '0');
    return n.s < 0 ? '-' + str : str;
  } // PROTOTYPE/INSTANCE METHODS

  /*
   * Return a new BigNumber whose value is the absolute value of this BigNumber.
   */


  P.absoluteValue = P.abs = function () {
    var x = new BigNumber(this);
    if (x.s < 0) x.s = 1;
    return x;
  };
  /*
   * Return
   *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
   *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
   *   0 if they have the same value,
   *   or null if the value of either is NaN.
   */


  P.comparedTo = function (y, b) {
    return compare(this, new BigNumber(y, b));
  };
  /*
   * If dp is undefined or null or true or false, return the number of decimal places of the
   * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
   *
   * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
   * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
   * ROUNDING_MODE if rm is omitted.
   *
   * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
   */


  P.decimalPlaces = P.dp = function (dp, rm) {
    var c,
        n,
        v,
        x = this;

    if (dp != null) {
      intCheck(dp, 0, MAX);
      if (rm == null) rm = ROUNDING_MODE;else intCheck(rm, 0, 8);
      return round(new BigNumber(x), dp + x.e + 1, rm);
    }

    if (!(c = x.c)) return null;
    n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE; // Subtract the number of trailing zeros of the last number.

    if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
    if (n < 0) n = 0;
    return n;
  };
  /*
   *  n / 0 = I
   *  n / N = N
   *  n / I = 0
   *  0 / n = 0
   *  0 / 0 = N
   *  0 / N = N
   *  0 / I = 0
   *  N / n = N
   *  N / 0 = N
   *  N / N = N
   *  N / I = N
   *  I / n = I
   *  I / 0 = I
   *  I / N = N
   *  I / I = N
   *
   * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
   * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
   */


  P.dividedBy = P.div = function (y, b) {
    return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
  };
  /*
   * Return a new BigNumber whose value is the integer part of dividing the value of this
   * BigNumber by the value of BigNumber(y, b).
   */


  P.dividedToIntegerBy = P.idiv = function (y, b) {
    return div(this, new BigNumber(y, b), 0, 1);
  };
  /*
   * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
   *
   * If m is present, return the result modulo m.
   * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
   * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
   *
   * The modular power operation works efficiently when x, n, and m are integers, otherwise it
   * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
   *
   * n {number|string|BigNumber} The exponent. An integer.
   * [m] {number|string|BigNumber} The modulus.
   *
   * '[BigNumber Error] Exponent not an integer: {n}'
   */


  P.exponentiatedBy = P.pow = function (n, m) {
    var half,
        isModExp,
        i,
        k,
        more,
        nIsBig,
        nIsNeg,
        nIsOdd,
        y,
        x = this;
    n = new BigNumber(n); // Allow NaN and ±Infinity, but not other non-integers.

    if (n.c && !n.isInteger()) {
      throw Error(bignumberError + 'Exponent not an integer: ' + valueOf(n));
    }

    if (m != null) m = new BigNumber(m); // Exponent of MAX_SAFE_INTEGER is 15.

    nIsBig = n.e > 14; // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.

    if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {
      // The sign of the result of pow when x is negative depends on the evenness of n.
      // If +n overflows to ±Infinity, the evenness of n would be not be known.
      y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
      return m ? y.mod(m) : y;
    }

    nIsNeg = n.s < 0;

    if (m) {
      // x % m returns NaN if abs(m) is zero, or m is NaN.
      if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);
      isModExp = !nIsNeg && x.isInteger() && m.isInteger();
      if (isModExp) x = x.mod(m); // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
    } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0 // [1, 240000000]
    ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7 // [80000000000000]  [99999750000000]
    : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {
      // If x is negative and n is odd, k = -0, else k = 0.
      k = x.s < 0 && isOdd(n) ? -0 : 0; // If x >= 1, k = ±Infinity.

      if (x.e > -1) k = 1 / k; // If n is negative return ±0, else return ±Infinity.

      return new BigNumber(nIsNeg ? 1 / k : k);
    } else if (POW_PRECISION) {
      // Truncating each coefficient array to a length of k after each multiplication
      // equates to truncating significant digits to POW_PRECISION + [28, 41],
      // i.e. there will be a minimum of 28 guard digits retained.
      k = mathceil(POW_PRECISION / LOG_BASE + 2);
    }

    if (nIsBig) {
      half = new BigNumber(0.5);
      if (nIsNeg) n.s = 1;
      nIsOdd = isOdd(n);
    } else {
      i = Math.abs(+valueOf(n));
      nIsOdd = i % 2;
    }

    y = new BigNumber(ONE); // Performs 54 loop iterations for n of 9007199254740991.

    for (;;) {
      if (nIsOdd) {
        y = y.times(x);
        if (!y.c) break;

        if (k) {
          if (y.c.length > k) y.c.length = k;
        } else if (isModExp) {
          y = y.mod(m); //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
        }
      }

      if (i) {
        i = mathfloor(i / 2);
        if (i === 0) break;
        nIsOdd = i % 2;
      } else {
        n = n.times(half);
        round(n, n.e + 1, 1);

        if (n.e > 14) {
          nIsOdd = isOdd(n);
        } else {
          i = +valueOf(n);
          if (i === 0) break;
          nIsOdd = i % 2;
        }
      }

      x = x.times(x);

      if (k) {
        if (x.c && x.c.length > k) x.c.length = k;
      } else if (isModExp) {
        x = x.mod(m); //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
      }
    }

    if (isModExp) return y;
    if (nIsNeg) y = ONE.div(y);
    return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
  };
  /*
   * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
   * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
   *
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
   */


  P.integerValue = function (rm) {
    var n = new BigNumber(this);
    if (rm == null) rm = ROUNDING_MODE;else intCheck(rm, 0, 8);
    return round(n, n.e + 1, rm);
  };
  /*
   * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
   * otherwise return false.
   */


  P.isEqualTo = P.eq = function (y, b) {
    return compare(this, new BigNumber(y, b)) === 0;
  };
  /*
   * Return true if the value of this BigNumber is a finite number, otherwise return false.
   */


  P.isFinite = function () {
    return !!this.c;
  };
  /*
   * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
   * otherwise return false.
   */


  P.isGreaterThan = P.gt = function (y, b) {
    return compare(this, new BigNumber(y, b)) > 0;
  };
  /*
   * Return true if the value of this BigNumber is greater than or equal to the value of
   * BigNumber(y, b), otherwise return false.
   */


  P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
    return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;
  };
  /*
   * Return true if the value of this BigNumber is an integer, otherwise return false.
   */


  P.isInteger = function () {
    return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
  };
  /*
   * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
   * otherwise return false.
   */


  P.isLessThan = P.lt = function (y, b) {
    return compare(this, new BigNumber(y, b)) < 0;
  };
  /*
   * Return true if the value of this BigNumber is less than or equal to the value of
   * BigNumber(y, b), otherwise return false.
   */


  P.isLessThanOrEqualTo = P.lte = function (y, b) {
    return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
  };
  /*
   * Return true if the value of this BigNumber is NaN, otherwise return false.
   */


  P.isNaN = function () {
    return !this.s;
  };
  /*
   * Return true if the value of this BigNumber is negative, otherwise return false.
   */


  P.isNegative = function () {
    return this.s < 0;
  };
  /*
   * Return true if the value of this BigNumber is positive, otherwise return false.
   */


  P.isPositive = function () {
    return this.s > 0;
  };
  /*
   * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
   */


  P.isZero = function () {
    return !!this.c && this.c[0] == 0;
  };
  /*
   *  n - 0 = n
   *  n - N = N
   *  n - I = -I
   *  0 - n = -n
   *  0 - 0 = 0
   *  0 - N = N
   *  0 - I = -I
   *  N - n = N
   *  N - 0 = N
   *  N - N = N
   *  N - I = N
   *  I - n = I
   *  I - 0 = I
   *  I - N = N
   *  I - I = N
   *
   * Return a new BigNumber whose value is the value of this BigNumber minus the value of
   * BigNumber(y, b).
   */


  P.minus = function (y, b) {
    var i,
        j,
        t,
        xLTy,
        x = this,
        a = x.s;
    y = new BigNumber(y, b);
    b = y.s; // Either NaN?

    if (!a || !b) return new BigNumber(NaN); // Signs differ?

    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

    if (!xe || !ye) {
      // Either Infinity?
      if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN); // Either zero?

      if (!xc[0] || !yc[0]) {
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x : // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
        ROUNDING_MODE == 3 ? -0 : 0);
      }
    }

    xe = bitFloor(xe);
    ye = bitFloor(ye);
    xc = xc.slice(); // Determine which is the bigger number.

    if (a = xe - ye) {
      if (xLTy = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse(); // Prepend zeros to equalise exponents.

      for (b = a; b--; t.push(0));

      t.reverse();
    } else {
      // Exponents equal. Check digit by digit.
      j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xLTy = xc[b] < yc[b];
          break;
        }
      }
    } // x < y? Point xc to the array of the bigger number.


    if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;
    b = (j = yc.length) - (i = xc.length); // Append zeros to xc if shorter.
    // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.

    if (b > 0) for (; b--; xc[i++] = 0);
    b = BASE - 1; // Subtract yc from xc.

    for (; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i]; xc[i] = b);

        --xc[i];
        xc[j] += BASE;
      }

      xc[j] -= yc[j];
    } // Remove leading zeros and adjust exponent accordingly.


    for (; xc[0] == 0; xc.splice(0, 1), --ye); // Zero?


    if (!xc[0]) {
      // Following IEEE 754 (2008) 6.3,
      // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
      y.s = ROUNDING_MODE == 3 ? -1 : 1;
      y.c = [y.e = 0];
      return y;
    } // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
    // for finite x and y.


    return normalise(y, xc, ye);
  };
  /*
   *   n % 0 =  N
   *   n % N =  N
   *   n % I =  n
   *   0 % n =  0
   *  -0 % n = -0
   *   0 % 0 =  N
   *   0 % N =  N
   *   0 % I =  0
   *   N % n =  N
   *   N % 0 =  N
   *   N % N =  N
   *   N % I =  N
   *   I % n =  N
   *   I % 0 =  N
   *   I % N =  N
   *   I % I =  N
   *
   * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
   * BigNumber(y, b). The result depends on the value of MODULO_MODE.
   */


  P.modulo = P.mod = function (y, b) {
    var q,
        s,
        x = this;
    y = new BigNumber(y, b); // Return NaN if x is Infinity or NaN, or y is NaN or zero.

    if (!x.c || !y.s || y.c && !y.c[0]) {
      return new BigNumber(NaN); // Return x if y is Infinity or x is zero.
    } else if (!y.c || x.c && !x.c[0]) {
      return new BigNumber(x);
    }

    if (MODULO_MODE == 9) {
      // Euclidian division: q = sign(y) * floor(x / abs(y))
      // r = x - qy    where  0 <= r < abs(y)
      s = y.s;
      y.s = 1;
      q = div(x, y, 0, 3);
      y.s = s;
      q.s *= s;
    } else {
      q = div(x, y, 0, MODULO_MODE);
    }

    y = x.minus(q.times(y)); // To match JavaScript %, ensure sign of zero is sign of dividend.

    if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;
    return y;
  };
  /*
   *  n * 0 = 0
   *  n * N = N
   *  n * I = I
   *  0 * n = 0
   *  0 * 0 = 0
   *  0 * N = N
   *  0 * I = N
   *  N * n = N
   *  N * 0 = N
   *  N * N = N
   *  N * I = N
   *  I * n = I
   *  I * 0 = N
   *  I * N = N
   *  I * I = I
   *
   * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
   * of BigNumber(y, b).
   */


  P.multipliedBy = P.times = function (y, b) {
    var c,
        e,
        i,
        j,
        k,
        m,
        xcL,
        xlo,
        xhi,
        ycL,
        ylo,
        yhi,
        zc,
        base,
        sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c; // Either NaN, ±Infinity or ±0?

    if (!xc || !yc || !xc[0] || !yc[0]) {
      // Return NaN if either is NaN, or one is 0 and the other is Infinity.
      if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
        y.c = y.e = y.s = null;
      } else {
        y.s *= x.s; // Return ±Infinity if either is ±Infinity.

        if (!xc || !yc) {
          y.c = y.e = null; // Return ±0 if either is ±0.
        } else {
          y.c = [0];
          y.e = 0;
        }
      }

      return y;
    }

    e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
    y.s *= x.s;
    xcL = xc.length;
    ycL = yc.length; // Ensure xc points to longer array and xcL to its length.

    if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i; // Initialise the result array with zeros.

    for (i = xcL + ycL, zc = []; i--; zc.push(0));

    base = BASE;
    sqrtBase = SQRT_BASE;

    for (i = ycL; --i >= 0;) {
      c = 0;
      ylo = yc[i] % sqrtBase;
      yhi = yc[i] / sqrtBase | 0;

      for (k = xcL, j = i + k; j > i;) {
        xlo = xc[--k] % sqrtBase;
        xhi = xc[k] / sqrtBase | 0;
        m = yhi * xlo + xhi * ylo;
        xlo = ylo * xlo + m % sqrtBase * sqrtBase + zc[j] + c;
        c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
        zc[j--] = xlo % base;
      }

      zc[j] = c;
    }

    if (c) {
      ++e;
    } else {
      zc.splice(0, 1);
    }

    return normalise(y, zc, e);
  };
  /*
   * Return a new BigNumber whose value is the value of this BigNumber negated,
   * i.e. multiplied by -1.
   */


  P.negated = function () {
    var x = new BigNumber(this);
    x.s = -x.s || null;
    return x;
  };
  /*
   *  n + 0 = n
   *  n + N = N
   *  n + I = I
   *  0 + n = n
   *  0 + 0 = 0
   *  0 + N = N
   *  0 + I = I
   *  N + n = N
   *  N + 0 = N
   *  N + N = N
   *  N + I = N
   *  I + n = I
   *  I + 0 = I
   *  I + N = N
   *  I + I = I
   *
   * Return a new BigNumber whose value is the value of this BigNumber plus the value of
   * BigNumber(y, b).
   */


  P.plus = function (y, b) {
    var t,
        x = this,
        a = x.s;
    y = new BigNumber(y, b);
    b = y.s; // Either NaN?

    if (!a || !b) return new BigNumber(NaN); // Signs differ?

    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

    if (!xe || !ye) {
      // Return ±Infinity if either ±Infinity.
      if (!xc || !yc) return new BigNumber(a / 0); // Either zero?
      // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.

      if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
    }

    xe = bitFloor(xe);
    ye = bitFloor(ye);
    xc = xc.slice(); // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.

    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();

      for (; a--; t.push(0));

      t.reverse();
    }

    a = xc.length;
    b = yc.length; // Point xc to the longer array, and b to the shorter length.

    if (a - b < 0) t = yc, yc = xc, xc = t, b = a; // Only start adding at yc.length - 1 as the further digits of xc can be ignored.

    for (a = 0; b;) {
      a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
      xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
    }

    if (a) {
      xc = [a].concat(xc);
      ++ye;
    } // No need to check for zero, as +x + +y != 0 && -x + -y != 0
    // ye = MAX_EXP + 1 possible


    return normalise(y, xc, ye);
  };
  /*
   * If sd is undefined or null or true or false, return the number of significant digits of
   * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
   * If sd is true include integer-part trailing zeros in the count.
   *
   * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
   * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
   * ROUNDING_MODE if rm is omitted.
   *
   * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
   *                     boolean: whether to count integer-part trailing zeros: true or false.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
   */


  P.precision = P.sd = function (sd, rm) {
    var c,
        n,
        v,
        x = this;

    if (sd != null && sd !== !!sd) {
      intCheck(sd, 1, MAX);
      if (rm == null) rm = ROUNDING_MODE;else intCheck(rm, 0, 8);
      return round(new BigNumber(x), sd, rm);
    }

    if (!(c = x.c)) return null;
    v = c.length - 1;
    n = v * LOG_BASE + 1;

    if (v = c[v]) {
      // Subtract the number of trailing zeros of the last element.
      for (; v % 10 == 0; v /= 10, n--); // Add the number of digits of the first element.


      for (v = c[0]; v >= 10; v /= 10, n++);
    }

    if (sd && x.e + 1 > n) n = x.e + 1;
    return n;
  };
  /*
   * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
   * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
   *
   * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
   */


  P.shiftedBy = function (k) {
    intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
    return this.times('1e' + k);
  };
  /*
   *  sqrt(-n) =  N
   *  sqrt(N) =  N
   *  sqrt(-I) =  N
   *  sqrt(I) =  I
   *  sqrt(0) =  0
   *  sqrt(-0) = -0
   *
   * Return a new BigNumber whose value is the square root of the value of this BigNumber,
   * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
   */


  P.squareRoot = P.sqrt = function () {
    var m,
        n,
        r,
        rep,
        t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5'); // Negative/NaN/Infinity/zero?

    if (s !== 1 || !c || !c[0]) {
      return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
    } // Initial estimate.


    s = Math.sqrt(+valueOf(x)); // Math.sqrt underflow/overflow?
    // Pass x to Math.sqrt as integer, then adjust the exponent of the result.

    if (s == 0 || s == 1 / 0) {
      n = coeffToString(c);
      if ((n.length + e) % 2 == 0) n += '0';
      s = Math.sqrt(+n);
      e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

      if (s == 1 / 0) {
        n = '1e' + e;
      } else {
        n = s.toExponential();
        n = n.slice(0, n.indexOf('e') + 1) + e;
      }

      r = new BigNumber(n);
    } else {
      r = new BigNumber(s + '');
    } // Check for zero.
    // r could be zero if MIN_EXP is changed after the this value was created.
    // This would cause a division by zero (x/t) and hence Infinity below, which would cause
    // coeffToString to throw.


    if (r.c[0]) {
      e = r.e;
      s = e + dp;
      if (s < 3) s = 0; // Newton-Raphson iteration.

      for (;;) {
        t = r;
        r = half.times(t.plus(div(x, t, dp, 1)));

        if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {
          // The exponent of r may here be one less than the final result exponent,
          // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
          // are indexed correctly.
          if (r.e < e) --s;
          n = n.slice(s - 3, s + 1); // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
          // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
          // iteration.

          if (n == '9999' || !rep && n == '4999') {
            // On the first iteration only, check to see if rounding up gives the
            // exact result as the nines may infinitely repeat.
            if (!rep) {
              round(t, t.e + DECIMAL_PLACES + 2, 0);

              if (t.times(t).eq(x)) {
                r = t;
                break;
              }
            }

            dp += 4;
            s += 4;
            rep = 1;
          } else {
            // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
            // result. If not, then there are further digits and m will be truthy.
            if (!+n || !+n.slice(1) && n.charAt(0) == '5') {
              // Truncate to the first rounding digit.
              round(r, r.e + DECIMAL_PLACES + 2, 1);
              m = !r.times(r).eq(x);
            }

            break;
          }
        }
      }
    }

    return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
  };
  /*
   * Return a string representing the value of this BigNumber in exponential notation and
   * rounded using ROUNDING_MODE to dp fixed decimal places.
   *
   * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
   */


  P.toExponential = function (dp, rm) {
    if (dp != null) {
      intCheck(dp, 0, MAX);
      dp++;
    }

    return format(this, dp, rm, 1);
  };
  /*
   * Return a string representing the value of this BigNumber in fixed-point notation rounding
   * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
   *
   * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
   * but e.g. (-0.00001).toFixed(0) is '-0'.
   *
   * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
   */


  P.toFixed = function (dp, rm) {
    if (dp != null) {
      intCheck(dp, 0, MAX);
      dp = dp + this.e + 1;
    }

    return format(this, dp, rm);
  };
  /*
   * Return a string representing the value of this BigNumber in fixed-point notation rounded
   * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
   * of the format or FORMAT object (see BigNumber.set).
   *
   * The formatting object may contain some or all of the properties shown below.
   *
   * FORMAT = {
   *   prefix: '',
   *   groupSize: 3,
   *   secondaryGroupSize: 0,
   *   groupSeparator: ',',
   *   decimalSeparator: '.',
   *   fractionGroupSize: 0,
   *   fractionGroupSeparator: '\xA0',      // non-breaking space
   *   suffix: ''
   * };
   *
   * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   * [format] {object} Formatting options. See FORMAT pbject above.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
   * '[BigNumber Error] Argument not an object: {format}'
   */


  P.toFormat = function (dp, rm, format) {
    var str,
        x = this;

    if (format == null) {
      if (dp != null && rm && typeof rm == 'object') {
        format = rm;
        rm = null;
      } else if (dp && typeof dp == 'object') {
        format = dp;
        dp = rm = null;
      } else {
        format = FORMAT;
      }
    } else if (typeof format != 'object') {
      throw Error(bignumberError + 'Argument not an object: ' + format);
    }

    str = x.toFixed(dp, rm);

    if (x.c) {
      var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;
      if (g2) i = g1, g1 = g2, g2 = i, len -= i;

      if (g1 > 0 && len > 0) {
        i = len % g1 || g1;
        intPart = intDigits.substr(0, i);

        for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);

        if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
        if (isNeg) intPart = '-' + intPart;
      }

      str = fractionPart ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize) ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'), '$&' + (format.fractionGroupSeparator || '')) : fractionPart) : intPart;
    }

    return (format.prefix || '') + str + (format.suffix || '');
  };
  /*
   * Return an array of two BigNumbers representing the value of this BigNumber as a simple
   * fraction with an integer numerator and an integer denominator.
   * The denominator will be a positive non-zero value less than or equal to the specified
   * maximum denominator. If a maximum denominator is not specified, the denominator will be
   * the lowest value necessary to represent the number exactly.
   *
   * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
   *
   * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
   */


  P.toFraction = function (md) {
    var d,
        d0,
        d1,
        d2,
        e,
        exp,
        n,
        n0,
        n1,
        q,
        r,
        s,
        x = this,
        xc = x.c;

    if (md != null) {
      n = new BigNumber(md); // Throw if md is less than one or is not an integer, unless it is Infinity.

      if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
        throw Error(bignumberError + 'Argument ' + (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
      }
    }

    if (!xc) return new BigNumber(x);
    d = new BigNumber(ONE);
    n1 = d0 = new BigNumber(ONE);
    d1 = n0 = new BigNumber(ONE);
    s = coeffToString(xc); // Determine initial denominator.
    // d is a power of 10 and the minimum max denominator that specifies the value exactly.

    e = d.e = s.length - x.e - 1;
    d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
    md = !md || n.comparedTo(d) > 0 ? e > 0 ? d : n1 : n;
    exp = MAX_EXP;
    MAX_EXP = 1 / 0;
    n = new BigNumber(s); // n0 = d1 = 0

    n0.c[0] = 0;

    for (;;) {
      q = div(n, d, 0, 1);
      d2 = d0.plus(q.times(d1));
      if (d2.comparedTo(md) == 1) break;
      d0 = d1;
      d1 = d2;
      n1 = n0.plus(q.times(d2 = n1));
      n0 = d2;
      d = n.minus(q.times(d2 = d));
      n = d2;
    }

    d2 = div(md.minus(d0), d1, 0, 1);
    n0 = n0.plus(d2.times(n1));
    d0 = d0.plus(d2.times(d1));
    n0.s = n1.s = x.s;
    e = e * 2; // Determine which fraction is closer to x, n0/d0 or n1/d1

    r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
    MAX_EXP = exp;
    return r;
  };
  /*
   * Return the value of this BigNumber converted to a number primitive.
   */


  P.toNumber = function () {
    return +valueOf(this);
  };
  /*
   * Return a string representing the value of this BigNumber rounded to sd significant digits
   * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
   * necessary to represent the integer part of the value in fixed-point notation, then use
   * exponential notation.
   *
   * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
   * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
   *
   * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
   */


  P.toPrecision = function (sd, rm) {
    if (sd != null) intCheck(sd, 1, MAX);
    return format(this, sd, rm, 2);
  };
  /*
   * Return a string representing the value of this BigNumber in base b, or base 10 if b is
   * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
   * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
   * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
   * TO_EXP_NEG, return exponential notation.
   *
   * [b] {number} Integer, 2 to ALPHABET.length inclusive.
   *
   * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
   */


  P.toString = function (b) {
    var str,
        n = this,
        s = n.s,
        e = n.e; // Infinity or NaN?

    if (e === null) {
      if (s) {
        str = 'Infinity';
        if (s < 0) str = '-' + str;
      } else {
        str = 'NaN';
      }
    } else {
      if (b == null) {
        str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(coeffToString(n.c), e) : toFixedPoint(coeffToString(n.c), e, '0');
      } else if (b === 10) {
        n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
        str = toFixedPoint(coeffToString(n.c), n.e, '0');
      } else {
        intCheck(b, 2, ALPHABET.length, 'Base');
        str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
      }

      if (s < 0 && n.c[0]) str = '-' + str;
    }

    return str;
  };
  /*
   * Return as toString, but do not accept a base argument, and include the minus sign for
   * negative zero.
   */


  P.valueOf = P.toJSON = function () {
    return valueOf(this);
  };

  P._isBigNumber = true;
  P[Symbol.toStringTag] = 'BigNumber'; // Node.js v10.12.0+

  P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
  if (configObject != null) BigNumber.set(configObject);
  return BigNumber;
} // PRIVATE HELPER FUNCTIONS
// These functions don't need access to variables,
// e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


function bitFloor(n) {
  var i = n | 0;
  return n > 0 || n === i ? i : i - 1;
} // Return a coefficient array as a string of base 10 digits.


function coeffToString(a) {
  var s,
      z,
      i = 1,
      j = a.length,
      r = a[0] + '';

  for (; i < j;) {
    s = a[i++] + '';
    z = LOG_BASE - s.length;

    for (; z--; s = '0' + s);

    r += s;
  } // Determine trailing zeros.


  for (j = r.length; r.charCodeAt(--j) === 48;);

  return r.slice(0, j + 1 || 1);
} // Compare the value of BigNumbers x and y.


function compare(x, y) {
  var a,
      b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e; // Either NaN?

  if (!i || !j) return null;
  a = xc && !xc[0];
  b = yc && !yc[0]; // Either zero?

  if (a || b) return a ? b ? 0 : -j : i; // Signs differ?

  if (i != j) return i;
  a = i < 0;
  b = k == l; // Either Infinity?

  if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1; // Compare exponents.

  if (!b) return k > l ^ a ? 1 : -1;
  j = (k = xc.length) < (l = yc.length) ? k : l; // Compare digit by digit.

  for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1; // Compare lengths.


  return k == l ? 0 : k > l ^ a ? 1 : -1;
}
/*
 * Check that n is a primitive number, an integer, and in range, otherwise throw.
 */


function intCheck(n, min, max, name) {
  if (n < min || n > max || n !== mathfloor(n)) {
    throw Error(bignumberError + (name || 'Argument') + (typeof n == 'number' ? n < min || n > max ? ' out of range: ' : ' not an integer: ' : ' not a primitive number: ') + String(n));
  }
} // Assumes finite n.


function isOdd(n) {
  var k = n.c.length - 1;
  return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
}

function toExponential(str, e) {
  return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) + (e < 0 ? 'e' : 'e+') + e;
}

function toFixedPoint(str, e, z) {
  var len, zs; // Negative exponent?

  if (e < 0) {
    // Prepend zeros.
    for (zs = z + '.'; ++e; zs += z);

    str = zs + str; // Positive exponent
  } else {
    len = str.length; // Append zeros.

    if (++e > len) {
      for (zs = z, e -= len; --e; zs += z);

      str += zs;
    } else if (e < len) {
      str = str.slice(0, e) + '.' + str.slice(e);
    }
  }

  return str;
} // EXPORT


var BigNumber = clone();

function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty$1(target, key, source[key]);
    });
  }

  return target;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  return Object.freeze(Object.defineProperties(strings, {
    raw: {
      value: Object.freeze(raw)
    }
  }));
}

var base = {
  global: {
    colors: {
      icon: '#666666'
    }
  },
  icon: {
    size: {
      small: '12px',
      medium: '24px',
      large: '48px',
      xlarge: '96px'
    }
  }
};
var defaultProps = {
  theme: base
}; // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

var normalizeColor = function normalizeColor(color, theme) {
  var colorSpec = theme.global.colors[color] || color; // If the color has a light or dark object, use that

  var result = colorSpec;

  if (theme.dark && colorSpec.dark) {
    result = colorSpec.dark;
  } else if (!theme.dark && colorSpec.light) {
    result = colorSpec.light;
  } // allow one level of indirection in color names


  if (result && theme.global.colors[result] && theme.global.colors[result] !== result) {
    result = normalizeColor(result, theme);
  }

  return result;
};

var colorStyle = function colorStyle(name, value, theme, required) {
  return styled.css(["", ":", ";"], name, normalizeColor(value, theme));
};

function _extends$1() {
  _extends$1 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$1.apply(this, arguments);
}

function _objectWithoutPropertiesLoose$1(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var colorCss = styled.css(["", " ", " g{fill:inherit;stroke:inherit;}*:not([stroke]){&[fill=\"none\"]{stroke-width:0;}}*[stroke*=\"#\"],*[STROKE*=\"#\"]{stroke:inherit;fill:none;}*[fill-rule],*[FILL-RULE],*[fill*=\"#\"],*[FILL*=\"#\"]{fill:inherit;stroke:none;}"], function (props) {
  return colorStyle('fill', props.color || props.theme.global.colors.icon, props.theme);
}, function (props) {
  return colorStyle('stroke', props.color || props.theme.global.colors.icon, props.theme);
});

var IconInner = function IconInner(_ref) {
  var a11yTitle = _ref.a11yTitle,
      color = _ref.color,
      size = _ref.size,
      theme = _ref.theme,
      rest = _objectWithoutPropertiesLoose$1(_ref, ["a11yTitle", "color", "size", "theme"]);

  return React__default.createElement("svg", _extends$1({
    "aria-label": a11yTitle
  }, rest));
};

IconInner.displayName = 'Icon';
var StyledIcon = styled__default(IconInner).withConfig({
  displayName: "StyledIcon",
  componentId: "ofa7kd-0"
})(["display:inline-block;flex:0 0 auto;", " ", " ", ""], function (_ref2) {
  var _ref2$size = _ref2.size,
      size = _ref2$size === void 0 ? 'medium' : _ref2$size,
      theme = _ref2.theme;
  return "\n    width: " + (theme.icon.size[size] || size) + ";\n    height: " + (theme.icon.size[size] || size) + ";\n  ";
}, function (_ref3) {
  var color = _ref3.color;
  return color !== 'plain' && colorCss;
}, function (_ref4) {
  var theme = _ref4.theme;
  return theme && theme.icon.extend;
});
StyledIcon.defaultProps = {};
Object.setPrototypeOf(StyledIcon.defaultProps, defaultProps);

function _extends$2() {
  _extends$2 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$2.apply(this, arguments);
}

var Close = function Close(props) {
  return React__default.createElement(StyledIcon, _extends$2({
    viewBox: "0 0 24 24",
    a11yTitle: "Close"
  }, props), React__default.createElement("path", {
    fill: "none",
    stroke: "#000",
    strokeWidth: "2",
    d: "M3,3 L21,21 M3,21 L21,3"
  }));
};
/*
  REUSED VARIABLES
*/


var baseSpacing = 24;
var scale = 6;
var baseFontSize = baseSpacing * 0.75; // 18

var fontScale = baseSpacing / scale; // 4

var base$1 = themes.generate(baseSpacing, scale);
var borderWidth = 1;
var fwRegular = 400;
var fwMedium = 500;
var fwDemibold = 600;
var ffStack = "AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";
var breakpoints = {
  small: {
    value: 768,
    edgeSize: {
      xxlarge: "72px",
      xxxlarge: "120px"
    }
  },
  medium: {
    value: 1200
  },
  large: {}
};
var brandColor = "#2762FF";
var brand2Color = "#FCBA59";
var gitcoinColors = {
  open: "#7ED321",
  started: brand2Color,
  Feature: "#FFC2D2",
  Bug: "#FFB5AE",
  Improvement: "#9EFFF7",
  Security: "#95FF94",
  Documentation: "#94FFED",
  Design: "#FF85C9",
  "Code Review": "#FFCE9E",
  Other: "#C2DBFF"
};
var black = "#000";
var white = "#fff";
/*
  TEXT & PARAGRAPHS
*/

var textSpecMedium = {
  size: "14px",
  height: "24px",
  maxWidth: ""
};
var textSpecLarge = {
  size: "16px",
  height: "32px",
  maxWidth: ""
};
var textSpecs = {
  small: textSpecMedium,
  medium: textSpecMedium,
  large: textSpecLarge,
  xlarge: textSpecLarge,
  xxlarge: textSpecLarge
};

var textSizes = _objectSpread({}, textSpecs, {
  extend: function extend(props) {
    return styled.css(["", ";", ""], props.textAlign && props.textAlign === "justify" && styled.css(["text-align:justify;"]), props.hyphens && styled.css(["hyphens:", ";"], props.hyphens === true ? "auto" : "unset"));
  }
});
/*
  THEME BOI
*/


var axisThemeConfig = object.deepMerge(base$1, {
  global: {
    colors: _objectSpread({
      "accent-1": brand2Color,
      focus: brandColor,
      brand: brandColor,
      // @NOTE: redifining these colors breaks the normalizeColor function
      // black,
      // white,
      text: {
        dark: white,
        light: black
      },
      grey: "#BDBDBD",
      border: black,
      placeholder: "grey",
      alert: "#e6f5ff"
    }, gitcoinColors),
    hover: {
      color: {
        light: "brand",
        dark: "white"
      }
    },
    size: {
      small: '302px'
    },
    breakpoints: _objectSpread({}, breakpoints),
    deviceBreakpoints: {
      phone: "small",
      tablet: "large",
      computer: "large"
    },
    edgeSize: {
      xxlarge: "144px",
      xxxlarge: "192px"
    },
    input: {
      weight: fwMedium
    },
    control: {
      border: {
        // NOTE: two below properties are not passed to the theme
        side: "bottom",
        color: "black",
        // These work
        radius: "0px",
        width: "1px"
      }
    },
    font: {
      family: ffStack,
      weight: fwRegular,
      size: "14px",
      height: 1.5
    }
  },
  icon: {
    extend: styled.css(["fill:", ";stroke:", ";"], black, black)
  },
  heading: {
    weight: fwDemibold,
    responsiveBreakpoint: null,
    extend: function extend(props) {
      return styled.css(["font-family:", ";"], ffStack);
    }
  },
  paragraph: textSizes,
  text: textSizes,
  anchor: {
    fontWeight: function fontWeight(props) {
      return props.bold ? fwDemibold : fwRegular;
    },
    textDecoration: "underline",
    color: {
      dark: "white",
      light: "black"
    },
    hover: {
      extend: styled.css(["color:", ";"], brandColor)
    },
    extend: styled.css(["&:active{opacity:0.9;}"])
  },
  box: {
    extend: function extend(props) {
      return styled.css(["", ""], props.responsiveChildren && styled.css(["> *{flex:1;}"]));
    }
  },
  button: {
    padding: {
      horizontal: "".concat(32 - borderWidth, "px"),
      vertical: "".concat(8 - borderWidth, "px")
    },
    border: {
      radius: "40px",
      width: "".concat(borderWidth, "px"),
      color: {
        dark: "white",
        light: "black"
      }
    },
    color: {
      dark: "white",
      light: "black"
    },
    primary: {
      color: {
        dark: "white",
        light: "black"
      }
    },
    extend: function extend(props) {
      return styled.css(["font-weight:", ";font-family:", ";text-align:center;font-size:16px;line-height:24px;", " ", " ", " ", ""], fwMedium, ffStack, !props.disabled && styled.css(["&:hover{box-shadow:none;border-color:", ";", "}&:active{opacity:0.9;}"], brandColor, !props.primary && styled.css(["color:", ";"], brandColor) || styled.css(["background-color:", ";"], brandColor)), !props.textAlign ? styled.css(["text-align:center;"]) : styled.css(["text-align:", ";"], props.textAlign), props.underline && styled.css(["text-decoration:underline;"]), props.white && styled.css(["&:hover{background-color:", ";border-color:", ";}"], white, white));
    }
  },
  calendar: {
    // daySize must align with global.size
    small: {
      fontSize: "".concat(baseFontSize - fontScale, "px"),
      lineHeight: 1.375,
      daySize: "".concat(baseSpacing * 12 / 7, "px"),
      slideDuration: '0.2s'
    }
  },
  dateInput: {},
  textArea: {
    extend: styled.css([""])
  },
  textInput: {
    extend: function extend(props) {
      return styled.css(["", ""], props.newsletter && styled.css(["font-weight:", ";font-family:", ";color:", ";border:none;border-bottom:", "px solid ", ";border-radius:0;padding-bottom:calc(11px - 1px);"], fwMedium, ffStack, black, borderWidth, props.newsletter && props.dark ? black : white));
    }
  },
  formField: {
    label: {
      color: "black",
      weight: fwRegular,
      margin: {
        top: "none",
        vertical: "2px",
        horizontal: undefined
      }
    },
    margin: 0,
    extend: styled.css(["label{line-height:1;}input{padding:16px 0 15px 0;line-height:1;}button{box-shadow:none;}"])
  },
  table: {
    /* NOTE:
     *
     */
    extend: styled.css([""]),
    header: {
      pad: {
        left: "none"
      },
      background: {},
      border: {
        side: "bottom",
        color: black
      }
    },
    body: {
      pad: {
        left: "none"
      },
      fill: "vertical",
      border: {
        side: "bottom",
        color: "grey"
      },
      extend: styled.css([""])
    },
    footer: {
      border: {
        side: "none"
      },
      extend: styled.css([""])
    }
  },
  layer: {
    overlay: {
      background: "rgba(0, 0, 0, 0.2)"
    },
    extend: styled.css([""])
  },
  dataTable: {
    primary: {
      weight: fwRegular
    }
  },
  tab: {
    color: "black",
    margin: "none",
    pad: {
      horizontal: "medium"
    },
    border: {
      side: "bottom",
      size: "1px",
      color: {
        dark: "grey",
        light: "grey"
      },
      active: {
        color: {
          dark: "white",
          light: "brand"
        }
      },
      hover: {
        color: {
          dark: "white",
          light: "black"
        }
      }
    },
    active: {
      color: "text",
      background: undefined
    },
    hover: {
      color: {
        light: "black",
        dark: "brand"
      }
    }
  },
  tabs: {
    gap: "none",
    header: {
      extend: styled.css(["justify-content:flex-start;"])
    },
    panel: {
      extend: styled.css([""])
    },
    extend: styled.css([""])
  },
  // Axis custom components
  modal: {
    icons: {
      close: Close
    }
  },
  section: {
    heading: {
      level: 3,
      gap: "medium"
    },
    border: {
      side: "bottom",
      size: "xsmall",
      color: "gray"
    }
  },
  select: {
    control: {
      extend: styled.css(["font-size:inherit;"])
    }
  }
});
var AvenirNextLTW01 = "data:font/woff2;base64,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";
var AvenirNextLTW01_500 = "data:font/woff2;base64,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";
var AvenirNextLTW01_600 = "data:font/woff2;base64,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";

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  // Global Reset \n  // modern-normalize | MIT License | https://github.com/sindresorhus/modern-normalize \n  html{box-sizing:border-box}*,::after,::before{box-sizing:inherit}:root{-moz-tab-size:4;tab-size:4}html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'}hr{height:0}abbr[title]{text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:SFMono-Regular,Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{padding:0}progress{vertical-align:baseline}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}\n  \n  // Fonts\n  @font-face {\n    font-family: \"AvenirNextLTW01\";\n    font-display: swap;\n    font-style: normal;\n    src: url(", ") format(\"woff2\");\n  }\n  @font-face {\n    font-family: \"AvenirNextLTW01\";\n    font-display: swap;\n    font-weight: 500;\n    src: url(", ") format(\"woff2\");\n  }\n  @font-face {\n    font-family: \"AvenirNextLTW01\";\n    font-display: swap;\n    font-weight: 600;\n    src: url(", ") format(\"woff2\");\n  }\n  \n  // HTML Element Overrides\n  b, strong {\n    font-weight: ", ";\n    font-family: ", ";\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var GlobalsStyles = styled.createGlobalStyle(_templateObject(), AvenirNextLTW01, AvenirNextLTW01_500, AvenirNextLTW01_600, fwDemibold, ffStack);

var AxisTheme = function AxisTheme(_ref) {
  var theme = _ref.theme,
      children = _ref.children,
      rest = _objectWithoutProperties(_ref, ["theme", "children"]);

  return React__default.createElement(grommet.Grommet, _extends({
    theme: theme || axisThemeConfig
  }, rest), React__default.createElement(GlobalsStyles, null), React__default.createElement(grommet.ThemeContext.Consumer, null, function (theme) {
    return React__default.createElement(styled.ThemeProvider, {
      theme: theme
    }, children);
  }));
};

var defaultThemeProps = {
  erc20Widget: {
    margin: "small"
  }
};
var overflowStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  width: '200px'
};
var specialTheme = {
  global: {
    font: {
      weight: 'normal'
    },
    colors: {
      focus: {
        border: {
          color: "none"
        }
      }
    }
  },
  select: {
    options: {
      text: {
        weight: 'normal'
      },
      container: {
        align: "start"
      }
    },
    icons: {
      color: "black",
      margin: "xsmall"
    }
  },
  formField: {
    border: {
      position: "outer",
      color: "none"
    },
    margin: {
      bottom: "none"
    }
  },
  anchor: {
    color: 'black',
    textDecoration: 'underline',
    size: 'small'
  }
};

var Tooltip = function Tooltip(_ref) {
  var children = _ref.children,
      target = _ref.target;
  return /*#__PURE__*/React__default.createElement(grommet.Drop, {
    align: {
      top: "bottom",
      left: "left"
    },
    target: target
  }, /*#__PURE__*/React__default.createElement(grommet.Box, {
    align: "center",
    round: "large",
    background: "dark-2"
  }, children));
};

var copyIcon = function copyIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("rect", {
    x: "7",
    y: "7",
    width: "8",
    height: "8",
    rx: "2",
    stroke: "#888888",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }), /*#__PURE__*/React__default.createElement("path", {
    d: "M3.84615 10H3.23077C2.55103 10 2 9.44897 2 8.76923V3.23077C2 2.55103 2.55103 2 3.23077 2H8.76923C9.44897 2 10 2.55103 10 3.23077V3.84615",
    stroke: "#888888",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }));
};

var Erc20Widget = function Erc20Widget(_ref2) {
  var value = _ref2.value,
      tokenData = _ref2.tokenData,
      search = _ref2.search,
      balance = _ref2.balance,
      limit = _ref2.limit,
      theme = _ref2.theme,
      precision = _ref2.precision,
      fieldLabel = _ref2.fieldLabel,
      account = _ref2.account,
      onValueChanged = _ref2.onValueChanged,
      errorMessage = _ref2.errorMessage,
      inline = _ref2.inline,
      input = _ref2.input,
      placeholderValue = _ref2.placeholderValue;
  var tokens = [];

  for (var k in tokenData) {
    tokens.push({
      'address': k,
      'logo': tokenData[k]['logo'],
      'decimals': tokenData[k]['decimals'],
      'symbol': tokenData[k]['symbol']
    });
  }

  var _useState = React.useState(value),
      _useState2 = _slicedToArray(_useState, 2),
      amount = _useState2[0],
      setAmount = _useState2[1];

  var _useState3 = React.useState(''),
      _useState4 = _slicedToArray(_useState3, 2),
      displayAmount = _useState4[0],
      setDisplayAmount = _useState4[1];

  var _useState5 = React.useState(search ? undefined : tokens[0]),
      _useState6 = _slicedToArray(_useState5, 2),
      selectedToken = _useState6[0],
      setToken = _useState6[1];

  var _useState7 = React.useState(tokens),
      _useState8 = _slicedToArray(_useState7, 2),
      options = _useState8[0],
      setOptions = _useState8[1];

  var _useState9 = React.useState(false),
      _useState10 = _slicedToArray(_useState9, 2),
      showDrop = _useState10[0],
      setDrop = _useState10[1];

  var _useState11 = React.useState(false),
      _useState12 = _slicedToArray(_useState11, 2),
      ellipsis = _useState12[0],
      setEllipsis = _useState12[1];

  var _useState13 = React.useState(false),
      _useState14 = _slicedToArray(_useState13, 2),
      showToolTip = _useState14[0],
      setToolTip = _useState14[1];

  var toolRef = React.useRef();
  var dropRef = React.useRef();

  if (amount && precision && amount.toString().includes('.')) {
    if (amount.toString().split('.').length > 0) {
      if (amount.toString().split('.')[1].length > precision) {
        setEllipsis(true);
      }
    }
  }

  var renderToken = function renderToken(token) {
    if (token) {
      return /*#__PURE__*/React__default.createElement(grommet.Box, {
        direction: "row",
        align: "center",
        gap: "small",
        pad: !inline ? "xsmall" : undefined
      }, /*#__PURE__*/React__default.createElement(grommet.Box, {
        direction: "row",
        align: "center"
      }, /*#__PURE__*/React__default.createElement("img", {
        src: token.logo,
        style: {
          width: "16px",
          height: "16px"
        }
      })), /*#__PURE__*/React__default.createElement(grommet.Box, {
        direction: "row",
        align: "start"
      }, /*#__PURE__*/React__default.createElement(grommet.Text, null, token.symbol)));
    } else return undefined;
  };

  var setMax = function setMax(value) {
    return /*#__PURE__*/React__default.createElement(grommet.Button, {
      plain: true,
      onClick: function onClick() {
        setAmount(new BigNumber(value));
        setDisplayAmount(new BigNumber(value).toFormat());
      }
    }, /*#__PURE__*/React__default.createElement(grommet.Text, {
      size: "small",
      weight: "bold"
    }, "Set Max"));
  };

  var validateInput = function validateInput() {
    if (onValueChanged != undefined) {
      onValueChanged(amount ? amount.toString() : '');
    } // Check for invalid characters


    if (!/^[0-9,.]*$/.test(displayAmount)) {
      return "Invalid Amount";
    } // Check for amount with too many decimals of precisions for specified token


    try {
      if ((amount === null || amount === void 0 ? void 0 : amount.toString().replace(/\.?0+$/, "").split('.')[1].length) > (selectedToken === null || selectedToken === void 0 ? void 0 : selectedToken.decimals)) {
        return "Invalid Amount";
      }
    } catch (_unused) {} // Check if amount is greater than balance


    if (amount && balance && new BigNumber(amount) > balance) {
      if (errorMessage) {
        return errorMessage;
      } else return "Invalid Amount";
    } // Check if amount is greater than limit


    if (amount && limit && new BigNumber(amount) > limit) {
      if (errorMessage) {
        return errorMessage;
      } else return "Invalid Amount";
    }

    if (amount && amount.isNaN()) {
      return "Invalid Amount";
    }
  };

  var copyAndHighlight = function copyAndHighlight() {
    copyToClipboard(amount ? amount.toString() : "");
  };

  var updateSearchList = function updateSearchList(text) {
    // The line below escapes regular expression special characters:
    // [ \ ^ $ . | ? * + ( )
    var escapedText = text.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
    var exp = new RegExp(escapedText, "i");
    setOptions(options.filter(function (o) {
      return exp.test(o.symbol);
    }));
  };

  var renderAddress = function renderAddress() {
    return /*#__PURE__*/React__default.createElement(grommet.Box, {
      direction: "row"
    }, /*#__PURE__*/React__default.createElement(grommet.Text, {
      style: overflowStyle
    }, "Account: ", account), /*#__PURE__*/React__default.createElement(grommet.Box, {
      onClick: function onClick() {
        return copyToClipboard(account);
      }
    }, copyIcon()));
  };

  var renderDisplayAmount = function renderDisplayAmount(newAmount) {
    if (newAmount == "NaN" || newAmount == "") {
      setDisplayAmount("");
      setAmount(new BigNumber(0));
    } else if (!/^[0-9,.]*$/.test(newAmount)) {
      setDisplayAmount(newAmount);
    } else if (newAmount[newAmount.length - 1] == '.' || newAmount[newAmount.length - 2] == '.' && newAmount[newAmount.length - 1] == '0') {
      setDisplayAmount(newAmount);
    } else {
      var newValue = newAmount.replace(/,/g, '');
      setAmount(new BigNumber(newValue));
      setDisplayAmount(new BigNumber(newValue).toFormat());
    }
  };

  return /*#__PURE__*/React__default.createElement(AxisTheme, {
    theme: specialTheme
  }, /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "column",
    align: "start",
    style: {
      width: tokens.length > 1 ? "336px" : "284px"
    }
  }, !inline && /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row-responsive",
    justify: "between",
    gap: "xsmall",
    fill: "horizontal"
  }, /*#__PURE__*/React__default.createElement(grommet.Text, {
    style: {
      fontSize: "small"
    }
  }, fieldLabel), /*#__PURE__*/React__default.createElement(grommet.Box, {
    pad: "xxxsmall",
    ref: dropRef,
    onMouseOver: function onMouseOver() {
      return selectedToken ? setDrop(true) : undefined;
    },
    onMouseOut: function onMouseOut() {
      return selectedToken ? setDrop(false) : undefined;
    }
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M8.00008 15.3333C3.93341 15.3333 0.666748 12.0666 0.666748 7.99996C0.666748 3.93329 3.93341 0.666626 8.00008 0.666626C12.0667 0.666626 15.3334 3.93329 15.3334 7.99996C15.3334 12.0666 12.0667 15.3333 8.00008 15.3333ZM8.00008 1.99996C4.66675 1.99996 2.00008 4.66663 2.00008 7.99996C2.00008 11.3333 4.66675 14 8.00008 14C11.3334 14 14.0001 11.3333 14.0001 7.99996C14.0001 4.66663 11.3334 1.99996 8.00008 1.99996Z",
    fill: "#EEEEEE"
  }), /*#__PURE__*/React__default.createElement("path", {
    d: "M7.99992 11.3334C7.59992 11.3334 7.33325 11.0667 7.33325 10.6667V8.00004C7.33325 7.60004 7.59992 7.33337 7.99992 7.33337C8.39992 7.33337 8.66659 7.60004 8.66659 8.00004V10.6667C8.66659 11.0667 8.39992 11.3334 7.99992 11.3334Z",
    fill: "#EEEEEE"
  }), /*#__PURE__*/React__default.createElement("path", {
    d: "M7.99992 5.99996C7.79992 5.99996 7.66659 5.93329 7.53325 5.79996C7.39992 5.66663 7.33325 5.53329 7.33325 5.33329C7.33325 5.13329 7.39992 4.99996 7.53325 4.86663C7.79992 4.59996 8.19992 4.59996 8.46659 4.86663C8.59992 4.99996 8.66659 5.13329 8.66659 5.33329C8.66659 5.53329 8.59992 5.66663 8.46659 5.79996C8.33325 5.93329 8.19992 5.99996 7.99992 5.99996Z",
    fill: "#EEEEEE"
  }))), showDrop && /*#__PURE__*/React__default.createElement(grommet.Drop, {
    stretch: false,
    pad: "small",
    onClickOutside: function onClickOutside() {
      return setDrop(false);
    },
    target: dropRef.current,
    align: {
      bottom: "top",
      left: "right"
    }
  }, /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "column"
  }, account && /*#__PURE__*/React__default.createElement(grommet.Text, null, "ERC20 Token Balance"), account && renderAddress(), /*#__PURE__*/React__default.createElement(grommet.Text, null, "Token: ", selectedToken === null || selectedToken === void 0 ? void 0 : selectedToken.symbol), /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row"
  }, /*#__PURE__*/React__default.createElement("a", {
    href: "https://etherscan.io/token/" + (selectedToken === null || selectedToken === void 0 ? void 0 : selectedToken.address),
    target: "_blank"
  }, "View Token"), "\xA0on Etherscan")))), /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row-responsive",
    gap: "xxsmall",
    justify: "between",
    fill: "horizontal"
  }, input && /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row",
    style: {
      borderBottom: "1px solid black"
    }
  }, /*#__PURE__*/React__default.createElement(grommet.Form, null, /*#__PURE__*/React__default.createElement(grommet.FormField, {
    validate: validateInput
  }, /*#__PURE__*/React__default.createElement(grommet.TextInput, {
    style: {
      maxWidth: "212px",
      fontWeight: 'normal'
    },
    placeholder: placeholderValue ? placeholderValue : "100,000,000.000",
    value: displayAmount,
    onChange: function onChange(event) {
      var newValue = event.target.value.replace(/[^\d.-]/g, '');
      renderDisplayAmount(newValue);
    }
  })))), !input && /*#__PURE__*/React__default.createElement(grommet.Box, {
    ref: toolRef,
    flex: "shrink",
    direction: "row",
    style: {
      borderBottom: !inline ? "1px solid #EEEEEE" : undefined,
      alignItems: "center"
    },
    onClick: function onClick(event) {
      if (event.detail == 2) {
        copyAndHighlight();
      }
    },
    onMouseOver: function onMouseOver() {
      return setToolTip(true);
    },
    onMouseOut: function onMouseOut() {
      return setToolTip(false);
    }
  }, /*#__PURE__*/React__default.createElement(grommet.Text, {
    style: {
      width: "212px"
    },
    truncate: true,
    id: "tokenValue"
  }, precision ? new BigNumber(value).toFormat(precision) + (ellipsis == true ? '…' : '') : new BigNumber(value).toFormat())), showToolTip && /*#__PURE__*/React__default.createElement(Tooltip, {
    target: toolRef.current
  }, /*#__PURE__*/React__default.createElement(grommet.Text, {
    size: "small"
  }, "Copy amount to clipboard")), tokens.length == 1 && /*#__PURE__*/React__default.createElement(grommet.Box, {
    fill: "horizontal",
    direction: "row",
    gap: "small",
    align: "center",
    border: !inline && {
      side: 'bottom',
      color: value ? '#EEEEEE' : "black"
    },
    style: {
      width: "72",
      maxWidth: "100px",
      borderLeft: !value ? '1px solid #EEEEEE' : undefined
    }
  }, renderToken(selectedToken)), tokens.length > 1 && /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row",
    gap: "small",
    align: "end",
    fill: "horizontal",
    style: {
      width: "120px",
      alignContent: "end",
      borderLeft: '1px solid #EEEEEE',
      borderBottom: '1px solid black'
    }
  }, /*#__PURE__*/React__default.createElement(grommet.Select, {
    plain: true,
    children: renderToken,
    options: tokens,
    value: value,
    labelKey: "label",
    onChange: function onChange(_ref3) {
      var option = _ref3.option;
      return setToken(option);
    },
    valueLabel: renderToken(selectedToken),
    onClose: function onClose() {
      return search ? setOptions(tokens) : undefined;
    },
    searchPlaceholder: search ? "Search" : undefined,
    onSearch: search ? function (text) {
      return updateSearchList(text);
    } : undefined
  }))), (balance || limit) && !inline && /*#__PURE__*/React__default.createElement(grommet.Box, {
    direction: "row",
    justify: "end",
    alignSelf: "end",
    gap: "small"
  }, balance ? /*#__PURE__*/React__default.createElement(grommet.Text, {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px'
    },
    size: "small",
    alignSelf: "end",
    truncate: true
  }, "Balance : ", new BigNumber(balance).toFormat()) : /*#__PURE__*/React__default.createElement(grommet.Text, {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px'
    },
    size: "small",
    alignSelf: "end",
    truncate: true
  }, "Limit : ", new BigNumber(limit).toFormat()), balance ? setMax(balance) : setMax(limit))));
};
defaultProps$1.extendDefaultTheme(defaultThemeProps);
Erc20Widget.defaultProps = _objectSpread2({
  tokenData: {
    "0x6b175474e89094c44da98b954eedeac495271d0f": {
      symbol: "DAI",
      logo: "",
      decimals: 18,
      name: "DAI"
    }
  },
  inline: false
}, defaultProps$1.defaultProps);
var Erc20Widget$1 = styled.withTheme(Erc20Widget);

exports.Erc20Widget = Erc20Widget$1;
//# sourceMappingURL=index.cjs.js.map
