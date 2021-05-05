import * as passport from 'passport';
import { inherits } from 'util';

export function Strategy(options, verify) {
  if (typeof options === 'function') {
    verify = options;
    options = {};
  }
  if (!verify) {
    throw new TypeError('LocalStrategy requires a verify callback');
  }

  this._usernameField = options.usernameField || 'username';
  this._passwordField = options.passwordField || 'password';
  this._tokenField = options.tokenField || 'token';

  passport.Strategy.call(this);
  this.name = '2fa';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

inherits(Strategy, passport.Strategy);

Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  const username =
    lookup(req.body, this._usernameField) ||
    lookup(req.query, this._usernameField);
  const password =
    lookup(req.body, this._passwordField) ||
    lookup(req.query, this._passwordField);
  const token =
    lookup(req.body, this._tokenField) ||
    lookup(req.query, this._tokenField);

  if (!username || !password) {
    return this.fail(
      { message: options.badRequestMessage || 'Missing credentials' },
      400,
    );
  }

  const self = this;

  function verified(err, user, info) {
    if (err) {
      return self.error(err);
    }
    if (!user) {
      return self.fail(info);
    }
    self.success(user, info);
  }

  try {
    if (self._passReqToCallback) {
      this._verify(req, username, password, token, verified);
    } else {
      this._verify(username, password, token, verified);
    }
  } catch (ex) {
    return self.error(ex);
  }
};

function lookup(obj, field) {
  if (!obj) {
    return null;
  }

  const chain = field
    .split(']')
    .join('')
    .split('[');
  for (let i = 0, len = chain.length; i < len; i++) {
    const prop = obj[chain[i]];
    if (typeof prop === 'undefined') {
      return null;
    }

    if (typeof prop !== 'object') {
      return prop;
    }

    obj = prop;
  }

  return null;
}
