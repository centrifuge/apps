import { CoreapiAttributeResponse } from '../../clients/centrifuge-node';

// Reverse function for unflatten and unflattenRaw
export const flatten = (data): any => {
  let result = {};
  const parse = (cur, key = '') => {
    if (isDocumentAttribute(cur)) {
      result[key] = {};
      for (let k in cur) {
        if (Number.isInteger(parseInt(k))) {
          parse(cur[k], key + '[' + k + ']');
        } else {
          result[key][k] = cur[k];
        }
      }
    } else {
      for (let k in cur) {
        parse(cur[k], key ? key + '.' + k : k);
      }
    }
  };

  parse(data);
  return result;
};

// It will parse and unflatten the custom attributes with no data manipulation
// Warning: Raw custom attributes have only objects. No arrays just array like objects that are not iterable
export const unflattenRaw = function(data): any {
  if (Object(data) !== data || Array.isArray(data)) return data;
  const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g;
  const result = {};
  for (let k in data) {
    let cur = result;
    let key = '';
    let m;
    while (m = regex.exec(k)) {
      cur = cur[key] || (cur[key] = (m[2] ? [] : {}));
      key = m[2] || m[1];
    }
    cur[key] = { ...data[k] };
  }
  return result[''];
};

// It will parse and unflatten the custom attributes and it will convert array like objects to arrays
export const unflatten = function(data): any {
  const result = unflattenRaw(data);
  let withIterables = {};
  for (let k in result) {
    withIterables[k] = toIterableDocumentAttribute({ ...result[k] });
  }
  return withIterables;
};

// Checks if object is an DocumentAttribute. Works for both Iterable and nonIterable DocumentAttributes
export const isDocumentAttribute = (obj) => {
  return (obj.hasOwnProperty('key') && obj.hasOwnProperty('type') && obj.hasOwnProperty('value'));
};

export const isArrayLikeDocumentAttribute = (obj) => {
  return isDocumentAttribute(obj) && obj.hasOwnProperty('0');
}


// Converts and array like Document Attribute to an array making it iterable
// ignores not isArrayLikeDocumentAttribute objects
// it is recursive on all the items in the array
export const toIterableDocumentAttribute = (documentAttribute: CoreapiAttributeResponse) => {
  if (!isArrayLikeDocumentAttribute(documentAttribute) ) return documentAttribute;
  const keys = Object.keys(documentAttribute);
  keys.sort();
  const iterable = [];
  for (let key of keys) {
    if(Number.isInteger(parseInt(key))) {
      iterable[key] = {};
      for (let p in documentAttribute[key]) {
        iterable[key][p] = toIterableDocumentAttribute(documentAttribute[key][p]);
      }
    } else {
      iterable[key] = documentAttribute[key];
    }
  }
  return iterable;
};

// Converts an Iterable Document Attribute to an array like object.
export const toUniterableDocumentAttribute = (documentAttribute: CoreapiAttributeResponse) => {
  if (!Array.isArray(documentAttribute)) return documentAttribute;
  let notIterable = {};
  for (let key in documentAttribute) {
    notIterable[key] = documentAttribute[key];
  }

  return notIterable;

};
