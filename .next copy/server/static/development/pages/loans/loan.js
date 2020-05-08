module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = require('../../../../ssr-module-cache.js');
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./components/Alert/index.tsx":
/*!************************************!*\
  !*** ./components/Alert/index.tsx ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/extends */ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectWithoutProperties */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutProperties.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! styled-components */ "styled-components");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(styled_components__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_5__);



var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/Alert/index.tsx";


function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__["default"])(["\n  padding: 24px;\n  background-color: ", ";\n  color: ", ";\n  border-radius: 18px;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}




function Alert(_ref) {
  var type = _ref.type,
      children = _ref.children,
      rest = Object(_babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_2__["default"])(_ref, ["type", "children"]);

  return react__WEBPACK_IMPORTED_MODULE_3___default.a.createElement(AlertContainer, Object(_babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_1__["default"])({
    type: type
  }, rest, {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 11
    },
    __self: this
  }), children);
}

var colors = {
  error: {
    backgroundColor: '#fed7d7',
    color: '#9b2c2c'
  },
  info: {
    backgroundColor: '#bee3f8',
    color: '#2c5282'
  },
  success: {
    backgroundColor: '#c6f6d5',
    color: '#276749'
  }
};
var AlertContainer = styled_components__WEBPACK_IMPORTED_MODULE_4___default()(grommet__WEBPACK_IMPORTED_MODULE_5__["Box"])(_templateObject(), function (p) {
  return colors[p.type].backgroundColor;
}, function (p) {
  return colors[p.type].color;
});
/* harmony default export */ __webpack_exports__["default"] = (Alert);

/***/ }),

/***/ "./components/Auth/index.tsx":
/*!***********************************!*\
  !*** ./components/Auth/index.tsx ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _ducks_auth__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../ducks/auth */ "./ducks/auth.ts");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var _services_tinlake__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../services/tinlake */ "./services/tinlake/index.ts");















var Auth =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_8__["default"])(Auth, _React$Component);

  function Auth() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_3__["default"])(this, Auth);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_5__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_6__["default"])(Auth)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_9__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_7__["default"])(_this), "state", {
      isAuthenticating: true
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_9__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_7__["default"])(_this), "isMounted", false);

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_9__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_7__["default"])(_this), "init",
    /*#__PURE__*/
    Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
    /*#__PURE__*/
    _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function _callee() {
      var _this$props, tinlake, waitForAuthentication, auth, loadUser, loadNetwork, observeAuthChanges, providerConfig;

      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this$props = _this.props, tinlake = _this$props.tinlake, waitForAuthentication = _this$props.waitForAuthentication, auth = _this$props.auth, loadUser = _this$props.loadUser, loadNetwork = _this$props.loadNetwork, observeAuthChanges = _this$props.observeAuthChanges;

              if (!waitForAuthentication) {
                _context.next = 11;
                break;
              }

              _context.prev = 2;
              _context.next = 5;
              return Object(_services_tinlake__WEBPACK_IMPORTED_MODULE_13__["authTinlake"])();

            case 5:
              _context.next = 10;
              break;

            case 7:
              _context.prev = 7;
              _context.t0 = _context["catch"](2);
              console.log("authentication failed with Error ".concat(_context.t0));

            case 10:
              if (_this.isMounted) {
                _this.setState({
                  isAuthenticating: false
                });
              }

            case 11:
              if (!(auth.state === null)) {
                _context.next = 22;
                break;
              }

              providerConfig = tinlake.provider && tinlake.provider.publicConfigStore && tinlake.provider.publicConfigStore.getState();

              if (!providerConfig) {
                _context.next = 20;
                break;
              }

              _context.next = 16;
              return loadUser(tinlake, providerConfig.selectedAddress);

            case 16:
              _context.next = 18;
              return loadNetwork(providerConfig.networkVersion);

            case 18:
              _context.next = 22;
              break;

            case 20:
              _context.next = 22;
              return loadUser(tinlake, tinlake.ethConfig.from);

            case 22:
              observeAuthChanges(tinlake);

            case 23:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[2, 7]]);
    })));

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(Auth, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      this.init();
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this.isMounted = true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.isMounted = false;
    }
  }, {
    key: "loadCurrentState",
    value: function loadCurrentState() {}
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          auth = _this$props2.auth,
          waitForAuthentication = _this$props2.waitForAuthentication,
          waitForAuthorization = _this$props2.waitForAuthorization;
      var isAuthenticating = this.state.isAuthenticating;
      var isAuthorizing = auth.state !== 'loaded';

      if (waitForAuthentication && isAuthenticating) {
        return null;
      }

      if (waitForAuthorization && isAuthorizing) {
        return null;
      }

      var extendedAuthState = Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_0__["default"])({}, auth, {
        isAuthenticated: !isAuthenticating,
        isAuthorized: !isAuthorizing
      });

      return this.props.render(extendedAuthState);
    }
  }]);

  return Auth;
}(react__WEBPACK_IMPORTED_MODULE_10__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_redux__WEBPACK_IMPORTED_MODULE_12__["connect"])(function (state) {
  return state;
}, {
  loadUser: _ducks_auth__WEBPACK_IMPORTED_MODULE_11__["loadUser"],
  loadNetwork: _ducks_auth__WEBPACK_IMPORTED_MODULE_11__["loadNetwork"],
  observeAuthChanges: _ducks_auth__WEBPACK_IMPORTED_MODULE_11__["observeAuthChanges"]
})(Auth));

/***/ }),

/***/ "./components/BackLink/index.tsx":
/*!***************************************!*\
  !*** ./components/BackLink/index.tsx ***!
  \***************************************/
/*! exports provided: BackLink */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BackLink", function() { return BackLink; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var grommet_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! grommet-icons */ "grommet-icons");
/* harmony import */ var grommet_icons__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(grommet_icons__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/link */ "./node_modules/next/link.js");
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/BackLink/index.tsx";



var BackLink = function BackLink(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(next_link__WEBPACK_IMPORTED_MODULE_2___default.a, {
    href: props.href,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 5
    },
    __self: this
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(grommet_icons__WEBPACK_IMPORTED_MODULE_1__["LinkPrevious"], {
    style: {
      cursor: 'pointer'
    },
    __source: {
      fileName: _jsxFileName,
      lineNumber: 6
    },
    __self: this
  }));
};

/***/ }),

/***/ "./components/Badge/index.tsx":
/*!************************************!*\
  !*** ./components/Badge/index.tsx ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/extends */ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! styled-components */ "styled-components");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(styled_components__WEBPACK_IMPORTED_MODULE_3__);


var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/Badge/index.tsx";

function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__["default"])(["\n  display: inline-block;\n  padding: 2px 6px;\n  border-radius: 20px;\n  border: 1px solid #808080;\n  line-height: 12px;\n  font-size: 12px;\n  color: #808080;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}




var Badge = function Badge(props) {
  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Container, Object(_babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_1__["default"])({}, props, {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 10
    },
    __self: this
  }), props.text);
};

var Container = styled_components__WEBPACK_IMPORTED_MODULE_3___default.a.div(_templateObject());
/* harmony default export */ __webpack_exports__["default"] = (Badge);

/***/ }),

/***/ "./components/Header/index.tsx":
/*!*************************************!*\
  !*** ./components/Header/index.tsx ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var grommet_icons__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! grommet-icons */ "grommet-icons");
/* harmony import */ var grommet_icons__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(grommet_icons__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! next/link */ "./node_modules/next/link.js");
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var _utils_formatAddress__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../utils/formatAddress */ "./utils/formatAddress.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../config */ "./config.ts");
/* harmony import */ var _services_tinlake__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../services/tinlake */ "./services/tinlake/index.ts");
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! next/router */ "next/router");
/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var _centrifuge_axis_nav_bar__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @centrifuge/axis-nav-bar */ "@centrifuge/axis-nav-bar");
/* harmony import */ var _centrifuge_axis_nav_bar__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(_centrifuge_axis_nav_bar__WEBPACK_IMPORTED_MODULE_18__);









var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/Header/index.tsx";










var isDemo = _config__WEBPACK_IMPORTED_MODULE_15__["default"].isDemo;

var Header =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__["default"])(Header, _React$Component);

  function Header(props) {
    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, Header);

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(Header).call(this, props));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "connectAccount",
    /*#__PURE__*/
    Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
    /*#__PURE__*/
    _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee() {
      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return Object(_services_tinlake__WEBPACK_IMPORTED_MODULE_16__["authTinlake"])();

            case 3:
              _context.next = 8;
              break;

            case 5:
              _context.prev = 5;
              _context.t0 = _context["catch"](0);
              console.log("authentication failed with Error ".concat(_context.t0));

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 5]]);
    })));

    _this.state = {
      chosenRoute: '/'
    };
    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(Header, [{
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          selectedRoute = _this$props.selectedRoute,
          menuItems = _this$props.menuItems,
          auth = _this$props.auth;
      var user = auth && auth.user;
      var address = user && user.address;
      var network = auth && auth.network;
      var itemGap = 'small';
      var logoUrl = isDemo && '/static/demo_logo.svg' || '/static/logo.svg';

      var _onRouteClick = function onRouteClick(route) {
        _this2.setState({
          chosenRoute: route
        });

        if (route.startsWith('/')) {
          next_router__WEBPACK_IMPORTED_MODULE_17___default.a.push(route);
        } else {
          window.open(route);
        }
      };

      var theme = {
        navBar: {
          icons: {
            menu: grommet_icons__WEBPACK_IMPORTED_MODULE_11__["Menu"],
            close: grommet_icons__WEBPACK_IMPORTED_MODULE_11__["Close"],
            user: grommet_icons__WEBPACK_IMPORTED_MODULE_11__["User"]
          }
        }
      };
      return react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        style: {
          position: 'sticky',
          top: 0,
          height: '90px',
          zIndex: 1
        },
        background: "white",
        border: {
          side: 'bottom',
          color: 'light-4'
        },
        justify: "center",
        align: "center",
        direction: "row",
        fill: "horizontal",
        pad: {
          horizontal: "small"
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 72
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["ResponsiveContext"].Consumer, {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 82
        },
        __self: this
      }, function (size) {
        return size === "large" ? react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          width: "xlarge",
          align: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 84
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          align: "center",
          direction: "row",
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 85
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(next_link__WEBPACK_IMPORTED_MODULE_13___default.a, {
          href: "/",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 86
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement("a", {
          title: "Tinlake",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 87
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Image"], {
          src: logoUrl,
          style: {
            width: 130
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 87
          },
          __self: this
        }))), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          fill: false,
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 89
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_centrifuge_axis_nav_bar__WEBPACK_IMPORTED_MODULE_18__["NavBar"], {
          border: false,
          theme: theme,
          menuItems: menuItems.filter(function (item) {
            return user && (isDemo && item.env === "demo" || item.env === "") && !item.secondary;
          }),
          overlayWidth: "100vw",
          selectedRoute: selectedRoute,
          onRouteClick: function onRouteClick(item) {
            _onRouteClick(item.route);
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 90
          },
          __self: this
        }))), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 111
          },
          __self: this
        }, !user && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "column",
          align: "end",
          basis: "full",
          alignSelf: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 113
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Button"], {
          onClick: _this2.connectAccount,
          label: "Connect",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 114
          },
          __self: this
        })), user && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "column",
          align: "end",
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 118
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          gap: itemGap,
          align: "center",
          justify: "start",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 119
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 120
          },
          __self: this
        }, " ", Object(_utils_formatAddress__WEBPACK_IMPORTED_MODULE_14__["formatAddress"])(address || ''), " ")), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          justify: "start",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 122
          },
          __self: this
        }, network && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
          style: {
            color: '#808080',
            lineHeight: '12px',
            fontSize: '12px'
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 123
          },
          __self: this
        }, " Connected to ", network, " "))), isDemo && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          pad: {
            left: "small"
          },
          alignSelf: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 128
          },
          __self: this
        }, " ", react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Anchor"], {
          href: "https://centrifuge.hackmd.io/zRnaoPqfS7mTm9XL0dDRtQ?view",
          target: "blank",
          label: "Help",
          style: {
            textDecoration: 'none',
            fontWeight: 900
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 128
          },
          __self: this
        }), " "))) : react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          width: "xlarge",
          align: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 133
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          align: "center",
          direction: "row",
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 134
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(next_link__WEBPACK_IMPORTED_MODULE_13___default.a, {
          href: "/",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 135
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement("a", {
          title: "Tinlake",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 136
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Image"], {
          src: logoUrl,
          style: {
            width: 130
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 136
          },
          __self: this
        })))), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          basis: "full",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 139
          },
          __self: this
        }, !user && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "column",
          align: "end",
          basis: "full",
          alignSelf: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 141
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Button"], {
          onClick: _this2.connectAccount,
          label: "Connect",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 142
          },
          __self: this
        })), user && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "column",
          align: "end",
          basis: "full",
          alignSelf: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 146
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          gap: itemGap,
          align: "center",
          justify: "start",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 147
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 148
          },
          __self: this
        }, " ", Object(_utils_formatAddress__WEBPACK_IMPORTED_MODULE_14__["formatAddress"])(address || ''), " ")), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          direction: "row",
          justify: "start",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 150
          },
          __self: this
        }, network && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
          style: {
            color: '#808080',
            lineHeight: '12px',
            fontSize: '12px'
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 151
          },
          __self: this
        }, " Connected to ", network, " "))), isDemo && react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          margin: {
            horizontal: "small"
          },
          alignSelf: "center",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 156
          },
          __self: this
        }, " ", react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Anchor"], {
          href: "https://centrifuge.hackmd.io/zRnaoPqfS7mTm9XL0dDRtQ?view",
          target: "blank",
          label: "Help",
          style: {
            textDecoration: 'none',
            fontWeight: 900
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 156
          },
          __self: this
        }), " "), react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
          fill: false,
          __source: {
            fileName: _jsxFileName,
            lineNumber: 159
          },
          __self: this
        }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_centrifuge_axis_nav_bar__WEBPACK_IMPORTED_MODULE_18__["NavBar"], {
          border: false,
          theme: theme,
          menuItems: menuItems.filter(function (item) {
            return user && (isDemo && item.env === "demo" || item.env === "") && !item.secondary;
          }),
          overlayWidth: "100vw",
          selectedRoute: selectedRoute,
          onRouteClick: function onRouteClick(item) {
            _onRouteClick(item.route);
          },
          __source: {
            fileName: _jsxFileName,
            lineNumber: 160
          },
          __self: this
        }))));
      }), " ");
    }
  }]);

  return Header;
}(react__WEBPACK_IMPORTED_MODULE_9___default.a.Component);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_redux__WEBPACK_IMPORTED_MODULE_12__["connect"])(function (state) {
  return state;
})(Header));

/***/ }),

/***/ "./components/Loan/Data/index.tsx":
/*!****************************************!*\
  !*** ./components/Loan/Data/index.tsx ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _NumberInput__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../NumberInput */ "./components/NumberInput/index.tsx");





var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/Loan/Data/index.tsx";





var LoanData =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__["default"])(LoanData, _React$Component);

  function LoanData() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, LoanData);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(LoanData).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(LoanData, [{
    key: "render",
    value: function render() {
      var _this$props$loan = this.props.loan,
          loanId = _this$props$loan.loanId,
          debt = _this$props$loan.debt,
          principal = _this$props$loan.principal,
          interestRate = _this$props$loan.interestRate,
          status = _this$props$loan.status;
      return react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 14
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        direction: "row",
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 15
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["FormField"], {
        label: "Loan ID",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 16
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["TextInput"], {
        value: loanId,
        disabled: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 17
        },
        __self: this
      })), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["FormField"], {
        label: "Status",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 19
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["TextInput"], {
        value: status,
        disabled: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 20
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        direction: "row",
        gap: "medium",
        margin: {
          bottom: 'medium',
          top: 'large'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 24
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 25
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["FormField"], {
        label: "Maximum borrow amount",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 26
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_NumberInput__WEBPACK_IMPORTED_MODULE_8__["default"], {
        value: Object(tinlake__WEBPACK_IMPORTED_MODULE_7__["baseToDisplay"])(principal, 18),
        suffix: " DAI",
        disabled: true,
        precision: 18,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 27
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 30
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["FormField"], {
        label: "Debt",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 31
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_NumberInput__WEBPACK_IMPORTED_MODULE_8__["default"], {
        value: Object(tinlake__WEBPACK_IMPORTED_MODULE_7__["baseToDisplay"])(debt, 18),
        suffix: " DAI",
        precision: 18,
        disabled: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 32
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 35
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_6__["FormField"], {
        label: "Interest rate",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 36
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_NumberInput__WEBPACK_IMPORTED_MODULE_8__["default"], {
        value: Object(tinlake__WEBPACK_IMPORTED_MODULE_7__["feeToInterestRate"])(interestRate),
        suffix: "%",
        disabled: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 37
        },
        __self: this
      })))));
    }
  }]);

  return LoanData;
}(react__WEBPACK_IMPORTED_MODULE_5__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (LoanData);

/***/ }),

/***/ "./components/NftData/index.tsx":
/*!**************************************!*\
  !*** ./components/NftData/index.tsx ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! styled-components */ "styled-components");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(styled_components__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _Badge__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../Badge */ "./components/Badge/index.tsx");
/* harmony import */ var _centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @centrifuge/axis-display-field */ "@centrifuge/axis-display-field");
/* harmony import */ var _centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../utils/etherscanLinkGenerator */ "./utils/etherscanLinkGenerator.ts");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_12__);






var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/NftData/index.tsx";

function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__["default"])(["\n  margin: 56px 0;\n  padding: 20px;\n  border-radius: 3px;\n  background: #f7f7f7;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}









var NftData =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_5__["default"])(NftData, _React$Component);

  function NftData() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, NftData);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_3__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_4__["default"])(NftData).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(NftData, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          _this$props$data = _this$props.data,
          registry = _this$props$data.registry,
          tokenId = _this$props$data.tokenId,
          nftOwner = _this$props$data.nftOwner,
          authedAddr = _this$props.authedAddr;
      return react__WEBPACK_IMPORTED_MODULE_6__["createElement"](NftDataContainer, {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 20
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Heading"], {
        level: "5",
        margin: "none",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 21
        },
        __self: this
      }, "NFT Data"), react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        direction: "row",
        gap: "medium",
        margin: {
          bottom: 'large',
          top: 'medium'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 22
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 23
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_6__["createElement"](_centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10__["DisplayField"], {
        label: 'NFT ID',
        copy: true,
        as: 'span',
        value: Object(_utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__["hexToInt"])(Object(tinlake__WEBPACK_IMPORTED_MODULE_12__["bnToHex"])(tokenId).toString()),
        link: {
          href: Object(_utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__["getNFTLink"])(Object(_utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__["hexToInt"])(Object(tinlake__WEBPACK_IMPORTED_MODULE_12__["bnToHex"])(tokenId).toString()), registry),
          target: '_blank'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 24
        },
        __self: this
      })), react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 35
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_6__["createElement"](_centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10__["DisplayField"], {
        label: 'NFT registry',
        copy: true,
        as: 'span',
        value: registry,
        link: {
          href: Object(_utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__["getAddressLink"])(registry),
          target: '_blank'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 36
        },
        __self: this
      })), react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        basis: '1/3',
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 47
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_6__["createElement"](_centrifuge_axis_display_field__WEBPACK_IMPORTED_MODULE_10__["DisplayField"], {
        label: 'NFT Owner',
        copy: true,
        as: 'span',
        value: nftOwner,
        link: {
          href: Object(_utils_etherscanLinkGenerator__WEBPACK_IMPORTED_MODULE_11__["getAddressLink"])(nftOwner),
          target: '_blank'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 48
        },
        __self: this
      }), authedAddr === nftOwner && react__WEBPACK_IMPORTED_MODULE_6__["createElement"](_Badge__WEBPACK_IMPORTED_MODULE_9__["default"], {
        text: 'Me',
        style: {
          position: 'absolute',
          left: 100,
          top: 32
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 59
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_6__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        direction: "row",
        gap: "medium",
        margin: {
          bottom: 'small',
          top: 'medium'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 62
        },
        __self: this
      }));
    }
  }]);

  return NftData;
}(react__WEBPACK_IMPORTED_MODULE_6__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (NftData);
var NftDataContainer = styled_components__WEBPACK_IMPORTED_MODULE_8___default()(grommet__WEBPACK_IMPORTED_MODULE_7__["Box"])(_templateObject());

/***/ }),

/***/ "./components/NumberInput/index.tsx":
/*!******************************************!*\
  !*** ./components/NumberInput/index.tsx ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/extends */ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectWithoutProperties */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutProperties.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_number_format__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-number-format */ "react-number-format");
/* harmony import */ var react_number_format__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_number_format__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_4__);


var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/NumberInput/index.tsx";




var NumberInput = function NumberInput(_ref) {
  var value = _ref.value,
      precision = _ref.precision,
      prefix = _ref.prefix,
      suffix = _ref.suffix,
      onValueChange = _ref.onValueChange,
      rest = Object(_babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_1__["default"])(_ref, ["value", "precision", "prefix", "suffix", "onValueChange"]);

  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react_number_format__WEBPACK_IMPORTED_MODULE_3___default.a, Object(_babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({
    thousandSeparator: ",",
    decimalScale: precision,
    fixedDecimalScale: true,
    allowNegative: false,
    prefix: prefix,
    suffix: suffix,
    customInput: grommet__WEBPACK_IMPORTED_MODULE_4__["TextInput"],
    value: value,
    onValueChange: onValueChange
  }, rest, {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 16
    },
    __self: this
  }));
};

NumberInput.defaultProps = {
  value: '0',
  precision: 2,
  prefix: '',
  suffix: ''
};
/* harmony default export */ __webpack_exports__["default"] = (NumberInput);

/***/ }),

/***/ "./components/SecondaryHeader/index.tsx":
/*!**********************************************!*\
  !*** ./components/SecondaryHeader/index.tsx ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/extends */ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectWithoutProperties */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutProperties.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! styled-components */ "styled-components");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(styled_components__WEBPACK_IMPORTED_MODULE_5__);



var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/components/SecondaryHeader/index.tsx";

function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_2__["default"])(["\n  position: sticky;\n  top: 90px ;\n  z-index: 2;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}




var StyledSecondaryHeader = styled_components__WEBPACK_IMPORTED_MODULE_5___default()(grommet__WEBPACK_IMPORTED_MODULE_4__["Box"])(_templateObject());
var SecondaryHeader = Object(styled_components__WEBPACK_IMPORTED_MODULE_5__["withTheme"])(function (props) {
  var children = props.children,
      rest = Object(_babel_runtime_corejs2_helpers_esm_objectWithoutProperties__WEBPACK_IMPORTED_MODULE_1__["default"])(props, ["children"]);

  return react__WEBPACK_IMPORTED_MODULE_3___default.a.createElement(StyledSecondaryHeader, Object(_babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_0__["default"])({
    background: "white",
    justify: "between",
    direction: "row",
    align: "center"
  }, rest, {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 15
    },
    __self: this
  }), children);
});
/* harmony default export */ __webpack_exports__["default"] = (SecondaryHeader);

/***/ }),

/***/ "./components/WithTinlake/index.tsx":
/*!******************************************!*\
  !*** ./components/WithTinlake/index.tsx ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _services_tinlake__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../services/tinlake */ "./services/tinlake/index.ts");












var WithTinlake =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__["default"])(WithTinlake, _React$Component);

  function WithTinlake() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, WithTinlake);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(WithTinlake)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "state", {
      loading: true
    });

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "tinlake", null);

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "isMounted", false);

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "init",
    /*#__PURE__*/
    Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
    /*#__PURE__*/
    _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee() {
      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return Object(_services_tinlake__WEBPACK_IMPORTED_MODULE_10__["getTinlake"])();

            case 2:
              _this.tinlake = _context.sent;

              if (_this.isMounted) {
                _this.setState({
                  loading: false
                });
              }

            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })));

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(WithTinlake, [{
    key: "componentWillMount",
    value: function componentWillMount() {}
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this.init();
      this.isMounted = true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.isMounted = false;
    }
  }, {
    key: "render",
    value: function render() {
      if (this.state.loading || !this.tinlake) {
        return null;
      }

      return this.props.render(this.tinlake);
    }
  }]);

  return WithTinlake;
}(react__WEBPACK_IMPORTED_MODULE_9__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (WithTinlake);

/***/ }),

/***/ "./config.ts":
/*!*******************!*\
  !*** ./config.ts ***!
  \*******************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var next_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/config */ "next/config");
/* harmony import */ var next_config__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_config__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_networkNameResolver__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/networkNameResolver */ "./utils/networkNameResolver.ts");



var _getConfig = next_config__WEBPACK_IMPORTED_MODULE_0___default()(),
    publicRuntimeConfig = _getConfig.publicRuntimeConfig;

var config = {
  rpcUrl: publicRuntimeConfig.RPC_URL,
  etherscanUrl: publicRuntimeConfig.ETHERSCAN_URL,
  // TODO: make this into publicRuntimeConfig
  gasLimit: 1000000000000000000,
  contractAddresses: publicRuntimeConfig.TINLAKE_ADDRESSES && JSON.parse(publicRuntimeConfig.TINLAKE_ADDRESSES),
  nftDataDefinition: publicRuntimeConfig.NFT_DATA_DEFINITION && JSON.parse(publicRuntimeConfig.NFT_DATA_DEFINITION),
  transactionTimeout: publicRuntimeConfig.TRANSACTION_TIMEOUT,
  tinlakeDataBackendUrl: publicRuntimeConfig.TINLAKE_DATA_BACKEND_URL,
  isDemo: publicRuntimeConfig.ENV && publicRuntimeConfig.ENV === 'demo',
  network: publicRuntimeConfig.RPC_URL && Object(_utils_networkNameResolver__WEBPACK_IMPORTED_MODULE_1__["networkUrlToName"])(publicRuntimeConfig.RPC_URL),
  contractConfig: JSON.parse(publicRuntimeConfig.CONTRACT_CONFIG) || {}
};

if (!config.nftDataDefinition) {
  throw new Error('Missing env NFT_DATA_DEFINITION');
}

if (!config.contractAddresses) {
  throw new Error('Missing env TINLAKE_ADDRESSES');
}

/* harmony default export */ __webpack_exports__["default"] = (config);

/***/ }),

/***/ "./containers/Loan/Borrow/index.tsx":
/*!******************************************!*\
  !*** ./containers/Loan/Borrow/index.tsx ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _components_NumberInput__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../components/NumberInput */ "./components/NumberInput/index.tsx");
/* harmony import */ var _services_tinlake_actions__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../services/tinlake/actions */ "./services/tinlake/actions.ts");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../ducks/transactions */ "./ducks/transactions.ts");
/* harmony import */ var _ducks_analytics__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../ducks/analytics */ "./ducks/analytics.ts");
/* harmony import */ var _ducks_loans__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../../ducks/loans */ "./ducks/loans.ts");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var _services_tinlake__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../../../services/tinlake */ "./services/tinlake/index.ts");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! bn.js */ "bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_19___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_19__);









var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/containers/Loan/Borrow/index.tsx";












var LoanBorrow =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__["default"])(LoanBorrow, _React$Component);

  function LoanBorrow() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, LoanBorrow);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(LoanBorrow)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "borrow",
    /*#__PURE__*/
    Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
    /*#__PURE__*/
    _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee() {
      var borrowAmount, _this$props, loan, _tinlake, res;

      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this.props.transactionSubmitted && _this.props.transactionSubmitted('Borrowing initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.');
              _context.prev = 1;
              _context.next = 4;
              return Object(_services_tinlake__WEBPACK_IMPORTED_MODULE_18__["authTinlake"])();

            case 4:
              borrowAmount = _this.state.borrowAmount;
              _this$props = _this.props, loan = _this$props.loan, _tinlake = _this$props.tinlake;
              _context.next = 8;
              return Object(_services_tinlake_actions__WEBPACK_IMPORTED_MODULE_12__["borrow"])(_tinlake, loan, borrowAmount);

            case 8:
              res = _context.sent;

              if (!(res && res.errorMsg)) {
                _context.next = 12;
                break;
              }

              _this.props.responseReceived && _this.props.responseReceived(null, "Borrowing failed. ".concat(res.errorMsg));
              return _context.abrupt("return");

            case 12:
              _this.props.responseReceived && _this.props.responseReceived('Borrowing successful. Please check your wallet.', null);
              _this.props.loadLoan && _this.props.loadLoan(_tinlake, loan.loanId);
              _context.next = 20;
              break;

            case 16:
              _context.prev = 16;
              _context.t0 = _context["catch"](1);
              _this.props.responseReceived && _this.props.responseReceived(null, "Borrowing failed. ".concat(_context.t0));
              console.log(_context.t0);

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[1, 16]]);
    })));

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(LoanBorrow, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      var _this$props2 = this.props,
          loan = _this$props2.loan,
          tinlake = _this$props2.tinlake,
          loadAnalyticsData = _this$props2.loadAnalyticsData;
      this.setState({
        borrowAmount: loan.principal || '0'
      });
      loadAnalyticsData && loadAnalyticsData(tinlake);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var borrowAmount = this.state.borrowAmount;
      var _this$props3 = this.props,
          loan = _this$props3.loan,
          analytics = _this$props3.analytics;
      var ceilingSet = loan.principal.toString() !== '0';
      var availableFunds = analytics && analytics.data && analytics.data.availableFunds || '0';
      var ceilingOverflow = new bn_js__WEBPACK_IMPORTED_MODULE_19___default.a(borrowAmount).cmp(new bn_js__WEBPACK_IMPORTED_MODULE_19___default.a(loan.principal)) > 0;
      var availableFundsOverflow = new bn_js__WEBPACK_IMPORTED_MODULE_19___default.a(borrowAmount).cmp(new bn_js__WEBPACK_IMPORTED_MODULE_19___default.a(availableFunds)) > 0;
      var borrowEnabled = !ceilingOverflow && !availableFundsOverflow && ceilingSet;
      return react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        basis: '1/4',
        gap: "medium",
        margin: {
          right: 'large'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 63
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 64
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["FormField"], {
        label: "Borrow amount",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 65
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](_components_NumberInput__WEBPACK_IMPORTED_MODULE_11__["default"], {
        value: Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["baseToDisplay"])(borrowAmount, 18),
        suffix: " DAI",
        precision: 18,
        onValueChange: function onValueChange(_ref2) {
          var value = _ref2.value;
          return _this2.setState({
            borrowAmount: Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["displayToBase"])(value, 18)
          });
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 66
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        align: "start",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 72
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Button"], {
        onClick: this.borrow,
        primary: true,
        label: "Borrow",
        disabled: !borrowEnabled,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 73
        },
        __self: this
      }), availableFundsOverflow && react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        margin: {
          top: 'small'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 75
        },
        __self: this
      }, "Available funds exceeded. ", react__WEBPACK_IMPORTED_MODULE_9__["createElement"]("br", {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 76
        },
        __self: this
      }), "Amount has to be lower then ", react__WEBPACK_IMPORTED_MODULE_9__["createElement"]("br", {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 77
        },
        __self: this
      }), react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
        weight: "bold",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 78
        },
        __self: this
      }, "".concat(Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["baseToDisplay"])(availableFunds, 18)))), ceilingOverflow && !availableFundsOverflow && react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        margin: {
          top: 'small'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 84
        },
        __self: this
      }, "Max borrow amount exceeded.   ", react__WEBPACK_IMPORTED_MODULE_9__["createElement"]("br", {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 85
        },
        __self: this
      }), "Amount has to be lower then ", react__WEBPACK_IMPORTED_MODULE_9__["createElement"]("br", {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 86
        },
        __self: this
      }), react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Text"], {
        weight: "bold",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 87
        },
        __self: this
      }, "".concat(Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["baseToDisplay"])(loan.principal, 18))))));
    }
  }]);

  return LoanBorrow;
}(react__WEBPACK_IMPORTED_MODULE_9__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_redux__WEBPACK_IMPORTED_MODULE_17__["connect"])(function (state) {
  return state;
}, {
  loadLoan: _ducks_loans__WEBPACK_IMPORTED_MODULE_16__["loadLoan"],
  transactionSubmitted: _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["transactionSubmitted"],
  responseReceived: _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["responseReceived"],
  loadAnalyticsData: _ducks_analytics__WEBPACK_IMPORTED_MODULE_15__["loadAnalyticsData"]
})(LoanBorrow));

/***/ }),

/***/ "./containers/Loan/Repay/index.tsx":
/*!*****************************************!*\
  !*** ./containers/Loan/Repay/index.tsx ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _components_NumberInput__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../components/NumberInput */ "./components/NumberInput/index.tsx");
/* harmony import */ var _services_tinlake_actions__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../services/tinlake/actions */ "./services/tinlake/actions.ts");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../ducks/transactions */ "./ducks/transactions.ts");
/* harmony import */ var _ducks_loans__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../ducks/loans */ "./ducks/loans.ts");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_16___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_16__);
/* harmony import */ var _services_tinlake__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../../../services/tinlake */ "./services/tinlake/index.ts");









var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/containers/Loan/Repay/index.tsx";










var LoanRepay =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_7__["default"])(LoanRepay, _React$Component);

  function LoanRepay() {
    var _getPrototypeOf2;

    var _this;

    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, LoanRepay);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, (_getPrototypeOf2 = Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(LoanRepay)).call.apply(_getPrototypeOf2, [this].concat(args)));

    Object(_babel_runtime_corejs2_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_8__["default"])(Object(_babel_runtime_corejs2_helpers_esm_assertThisInitialized__WEBPACK_IMPORTED_MODULE_6__["default"])(_this), "repay",
    /*#__PURE__*/
    Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
    /*#__PURE__*/
    _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee() {
      var repayAmount, _this$props, _transactionSubmitted, _responseReceived, _loadLoan, loan, _tinlake, res;

      return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return Object(_services_tinlake__WEBPACK_IMPORTED_MODULE_17__["authTinlake"])();

            case 3:
              repayAmount = _this.state.repayAmount;
              _this$props = _this.props, _transactionSubmitted = _this$props.transactionSubmitted, _responseReceived = _this$props.responseReceived, _loadLoan = _this$props.loadLoan, loan = _this$props.loan, _tinlake = _this$props.tinlake; // support partial repay later

              _transactionSubmitted && _transactionSubmitted("Repayment initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.");
              _context.next = 8;
              return Object(_services_tinlake_actions__WEBPACK_IMPORTED_MODULE_12__["repay"])(_tinlake, loan);

            case 8:
              res = _context.sent;

              if (!(res && res.errorMsg)) {
                _context.next = 12;
                break;
              }

              _responseReceived && _responseReceived(null, "Repayment failed. ".concat(res.errorMsg));
              return _context.abrupt("return");

            case 12:
              _responseReceived && _responseReceived("Repayment successful. Please check your wallet.", null);
              _loadLoan && _loadLoan(_tinlake, loan.loanId);
              _context.next = 20;
              break;

            case 16:
              _context.prev = 16;
              _context.t0 = _context["catch"](0);
              _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["responseReceived"] && Object(_ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["responseReceived"])(null, "Repayment failed. ".concat(_context.t0));
              console.log(_context.t0);

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 16]]);
    })));

    return _this;
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(LoanRepay, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      var loan = this.props.loan;
      this.setState({
        repayAmount: loan.debt || '0'
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var repayAmount = this.state.repayAmount;
      var loan = this.props.loan;
      var hasDebt = loan.debt.toString() !== '0';
      return react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        basis: '1/4',
        gap: "medium",
        margin: {
          right: "large"
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 55
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        gap: "medium",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 56
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["FormField"], {
        label: "Repay amount",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 57
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](_components_NumberInput__WEBPACK_IMPORTED_MODULE_11__["default"], {
        value: Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["baseToDisplay"])(repayAmount, 18),
        suffix: " DAI",
        precision: 18,
        onValueChange: function onValueChange(_ref2) {
          var value = _ref2.value;
          return _this2.setState({
            repayAmount: Object(tinlake__WEBPACK_IMPORTED_MODULE_13__["displayToBase"])(value)
          });
        },
        disabled: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 58
        },
        __self: this
      }))), react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        align: "start",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 65
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Button"], {
        onClick: this.repay,
        primary: true,
        label: "Repay",
        disabled: !hasDebt,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 66
        },
        __self: this
      })));
    }
  }]);

  return LoanRepay;
}(react__WEBPACK_IMPORTED_MODULE_9__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_redux__WEBPACK_IMPORTED_MODULE_16__["connect"])(function (state) {
  return state;
}, {
  loadLoan: _ducks_loans__WEBPACK_IMPORTED_MODULE_15__["loadLoan"],
  transactionSubmitted: _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["transactionSubmitted"],
  responseReceived: _ducks_transactions__WEBPACK_IMPORTED_MODULE_14__["responseReceived"]
})(LoanRepay));

/***/ }),

/***/ "./containers/Loan/View/index.tsx":
/*!****************************************!*\
  !*** ./containers/Loan/View/index.tsx ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _ducks_loans__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../ducks/loans */ "./ducks/loans.ts");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _components_Alert__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../components/Alert */ "./components/Alert/index.tsx");
/* harmony import */ var _components_Loan_Data__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../../components/Loan/Data */ "./components/Loan/Data/index.tsx");
/* harmony import */ var _Borrow__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../Borrow */ "./containers/Loan/Borrow/index.tsx");
/* harmony import */ var _Repay__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../Repay */ "./containers/Loan/Repay/index.tsx");
/* harmony import */ var _centrifuge_axis_spinner__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @centrifuge/axis-spinner */ "@centrifuge/axis-spinner");
/* harmony import */ var _centrifuge_axis_spinner__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(_centrifuge_axis_spinner__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var _components_NftData__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../components/NftData */ "./components/NftData/index.tsx");
/* harmony import */ var _ducks_auth__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../ducks/auth */ "./ducks/auth.ts");
/* harmony import */ var _ducks_transactions__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../../ducks/transactions */ "./ducks/transactions.ts");





var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/containers/Loan/View/index.tsx";













// on state change tokenId --> load nft data for loan collateral
var LoanView =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_4__["default"])(LoanView, _React$Component);

  function LoanView() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, LoanView);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_2__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_3__["default"])(LoanView).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(LoanView, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      var _this$props = this.props,
          tinlake = _this$props.tinlake,
          loanId = _this$props.loanId,
          loadLoan = _this$props.loadLoan,
          resetTransactionState = _this$props.resetTransactionState,
          loadUserProxies = _this$props.loadUserProxies;
      loanId && loadLoan(tinlake, loanId);
      resetTransactionState && resetTransactionState();
      loadUserProxies && loadUserProxies();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.props.resetTransactionState && this.props.resetTransactionState();
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          loans = _this$props2.loans,
          loanId = _this$props2.loanId,
          tinlake = _this$props2.tinlake,
          auth = _this$props2.auth,
          transactions = _this$props2.transactions;
      var _ref = loans,
          loan = _ref.loan,
          loanState = _ref.loanState;

      if (loanState === null || loanState === 'loading') {
        return null;
      }

      if (loanState === 'not found') {
        return react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_components_Alert__WEBPACK_IMPORTED_MODULE_9__["default"], {
          margin: "medium",
          type: "error",
          __source: {
            fileName: _jsxFileName,
            lineNumber: 46
          },
          __self: this
        }, "Could not find loan ", loanId);
      }

      var user = auth && auth.user;
      var hasAdminPermissions = user && user.permissions.canSetInterestRate;
      var hasBorrowerPermissions = user && loan && user.proxies.includes(loan.ownerOf);

      if (transactions && transactions.transactionState && transactions.transactionState === 'processing') {
        return react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_centrifuge_axis_spinner__WEBPACK_IMPORTED_MODULE_13__["Spinner"], {
          height: 'calc(100vh - 89px - 84px)',
          message: transactions.loadingMessage || 'Processing Transaction. This may take a few seconds. Please wait...',
          __source: {
            fileName: _jsxFileName,
            lineNumber: 54
          },
          __self: this
        });
      }

      return react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 57
        },
        __self: this
      }, transactions && transactions.successMessage && react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        margin: {
          bottom: 'large'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 59
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_components_Alert__WEBPACK_IMPORTED_MODULE_9__["default"], {
        type: "success",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 60
        },
        __self: this
      }, transactions.successMessage, " ")), transactions && transactions.errorMessage && react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        margin: {
          bottom: 'large'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 65
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_components_Alert__WEBPACK_IMPORTED_MODULE_9__["default"], {
        type: "error",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 66
        },
        __self: this
      }, transactions.errorMessage)), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_components_Loan_Data__WEBPACK_IMPORTED_MODULE_10__["default"], {
        loan: loan,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 71
        },
        __self: this
      }), loan && loan.status !== 'closed' && react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 73
        },
        __self: this
      }, hasBorrowerPermissions && react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        margin: {
          top: 'large',
          bottom: 'large'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 88
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        gap: "medium",
        align: "start",
        margin: {
          bottom: 'medium'
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 89
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Heading"], {
        level: "5",
        margin: "none",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 90
        },
        __self: this
      }, "Borrow / Repay ")), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_7__["Box"], {
        direction: "row",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 92
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_Borrow__WEBPACK_IMPORTED_MODULE_11__["default"], {
        loan: loan,
        tinlake: tinlake,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 93
        },
        __self: this
      }, " "), react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_Repay__WEBPACK_IMPORTED_MODULE_12__["default"], {
        loan: loan,
        tinlake: tinlake,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 94
        },
        __self: this
      }, " ")))), loan && loan.nft && react__WEBPACK_IMPORTED_MODULE_5__["createElement"](_components_NftData__WEBPACK_IMPORTED_MODULE_14__["default"], {
        data: loan.nft,
        authedAddr: tinlake.ethConfig.from,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 100
        },
        __self: this
      }));
    }
  }]);

  return LoanView;
}(react__WEBPACK_IMPORTED_MODULE_5__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_redux__WEBPACK_IMPORTED_MODULE_8__["connect"])(function (state) {
  return state;
}, {
  loadLoan: _ducks_loans__WEBPACK_IMPORTED_MODULE_6__["loadLoan"],
  resetTransactionState: _ducks_transactions__WEBPACK_IMPORTED_MODULE_16__["resetTransactionState"],
  loadUserProxies: _ducks_auth__WEBPACK_IMPORTED_MODULE_15__["loadUserProxies"]
})(LoanView));

/***/ }),

/***/ "./ducks/analytics.ts":
/*!****************************!*\
  !*** ./ducks/analytics.ts ***!
  \****************************/
/*! exports provided: default, loadAnalyticsData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return reducer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadAnalyticsData", function() { return loadAnalyticsData; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");
/* harmony import */ var _services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/tinlake/actions */ "./services/tinlake/actions.ts");




// Actions
var LOAD_ANALYTICS = 'tinlake-ui/analytics/LOAD_ANALYTICS';
var RECEIVE_ANALYTICS = 'tinlake-ui/analytics/RECEIVE_ANALYTICS';
var initialState = {
  state: null,
  data: null
};
function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    type: ''
  };

  switch (action.type) {
    case LOAD_ANALYTICS:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        state: 'loading'
      });

    case RECEIVE_ANALYTICS:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        state: 'found',
        data: action.data
      });

    default:
      return state;
  }
}
function loadAnalyticsData(tinlake) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(dispatch) {
        var analyticsData;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dispatch({
                  type: LOAD_ANALYTICS
                });
                _context.next = 3;
                return Object(_services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__["getAnalytics"])(tinlake);

              case 3:
                analyticsData = _context.sent;
                dispatch({
                  data: analyticsData && analyticsData.data,
                  type: RECEIVE_ANALYTICS
                });

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()
  );
}

/***/ }),

/***/ "./ducks/auth.ts":
/*!***********************!*\
  !*** ./ducks/auth.ts ***!
  \***********************/
/*! exports provided: default, loadUser, loadUserProxies, loadNetwork, observeAuthChanges, clearUser */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return reducer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadUser", function() { return loadUser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadUserProxies", function() { return loadUserProxies; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadNetwork", function() { return loadNetwork; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "observeAuthChanges", function() { return observeAuthChanges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clearUser", function() { return clearUser; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");
/* harmony import */ var _utils_networkNameResolver__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/networkNameResolver */ "./utils/networkNameResolver.ts");
/* harmony import */ var _services_apollo__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/apollo */ "./services/apollo/index.ts");




 // Actions

var LOAD = 'tinlake-ui/auth/LOAD';
var RECEIVE = 'tinlake-ui/auth/RECEIVE';
var CLEAR = 'tinlake-ui/auth/CLEAR';
var CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK';
var RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK';
var RECEIVE_PROXIES = 'tinlake-ui/auth/RECEIVE_PROXIES';
var OBSERVING_AUTH_CHANGES = 'tinlake-ui/auth/OBSERVING_AUTH_CHANGES';
var initialState = {
  observingAuthChanges: false,
  state: null,
  user: null,
  network: null
}; // Reducer

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    type: ''
  };

  switch (action.type) {
    case LOAD:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        state: 'loading'
      });

    case RECEIVE:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        state: 'loaded',
        user: action.user
      });

    case CLEAR:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        state: 'loaded',
        user: null
      });

    case OBSERVING_AUTH_CHANGES:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        observingAuthChanges: true
      });

    case CLEAR_NETWORK:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        network: null
      });

    case RECEIVE_NETWORK:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        network: action.network
      });

    case RECEIVE_PROXIES:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        user: action.user
      });

    default:
      return state;
  }
} // side effects, only as applicable
// e.g. thunks, epics, etc

function loadUser(tinlake, address) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(dispatch, getState) {
        var _getState, auth, interestRatePermission, loanPricePermission, equityRatioPermission, riskScorePermission, investorAllowancePermissionJunior, investorAllowancePermissionSenior, result, proxies, user;

        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _getState = getState(), auth = _getState.auth; // don't load again if already loading

                if (!(auth.state === 'loading')) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt("return");

              case 3:
                if (address) {
                  _context.next = 6;
                  break;
                }

                dispatch({
                  type: CLEAR
                });
                return _context.abrupt("return");

              case 6:
                if (!(auth.user && auth.user.address.toLowerCase() === address.toLowerCase())) {
                  _context.next = 8;
                  break;
                }

                return _context.abrupt("return");

              case 8:
                dispatch({
                  type: LOAD
                });
                _context.next = 11;
                return tinlake.canSetInterestRate(address);

              case 11:
                interestRatePermission = _context.sent;
                _context.next = 14;
                return tinlake.canSetLoanPrice(address);

              case 14:
                loanPricePermission = _context.sent;
                _context.next = 17;
                return tinlake.canSetMinimumJuniorRatio(address);

              case 17:
                equityRatioPermission = _context.sent;
                _context.next = 20;
                return tinlake.canSetRiskScore(address);

              case 20:
                riskScorePermission = _context.sent;
                _context.next = 23;
                return tinlake.canSetInvestorAllowanceJunior(address);

              case 23:
                investorAllowancePermissionJunior = _context.sent;
                _context.next = 26;
                return tinlake.canSetInvestorAllowanceSenior(address);

              case 26:
                investorAllowancePermissionSenior = _context.sent;
                _context.next = 29;
                return _services_apollo__WEBPACK_IMPORTED_MODULE_4__["default"].getProxies(address);

              case 29:
                result = _context.sent;
                proxies = result.data;
                user = {
                  address: address,
                  proxies: proxies,
                  permissions: {
                    canSetInterestRate: interestRatePermission,
                    canSetLoanPrice: loanPricePermission,
                    canSetMinimumJuniorRatio: equityRatioPermission,
                    canSetRiskScore: riskScorePermission,
                    canSetInvestorAllowanceJunior: investorAllowancePermissionJunior,
                    canSetInvestorAllowanceSenior: investorAllowancePermissionSenior // TODO: canActAsKeeper

                  }
                };
                dispatch({
                  user: user,
                  type: RECEIVE
                });

              case 33:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }()
  );
}
function loadUserProxies() {
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee2(dispatch, getState) {
        var _getState2, auth, result, proxies, user;

        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _getState2 = getState(), auth = _getState2.auth; // clear user if no address given

                if (!(!auth.user || !auth.user.address)) {
                  _context2.next = 4;
                  break;
                }

                dispatch({
                  type: CLEAR
                });
                return _context2.abrupt("return");

              case 4:
                _context2.next = 6;
                return _services_apollo__WEBPACK_IMPORTED_MODULE_4__["default"].getProxies(auth.user.address);

              case 6:
                result = _context2.sent;
                proxies = result.data;
                user = Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, auth.user, {
                  proxies: proxies
                });
                dispatch({
                  user: user,
                  type: RECEIVE_PROXIES
                });

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x3, _x4) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
}
function loadNetwork(network) {
  return (
    /*#__PURE__*/
    function () {
      var _ref3 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee3(dispatch, getState) {
        var _getState3, auth, networkName;

        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _getState3 = getState(), auth = _getState3.auth;

                if (network) {
                  _context3.next = 4;
                  break;
                }

                dispatch({
                  type: CLEAR_NETWORK
                });
                return _context3.abrupt("return");

              case 4:
                networkName = Object(_utils_networkNameResolver__WEBPACK_IMPORTED_MODULE_3__["networkIdToName"])(network); // if network is already loaded, don't load again

                if (!(auth.network === networkName)) {
                  _context3.next = 7;
                  break;
                }

                return _context3.abrupt("return");

              case 7:
                dispatch({
                  network: networkName,
                  type: RECEIVE_NETWORK
                });

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x5, _x6) {
        return _ref3.apply(this, arguments);
      };
    }()
  );
}
var providerChecks;
function observeAuthChanges(tinlake) {
  return (
    /*#__PURE__*/
    function () {
      var _ref4 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee4(dispatch, getState) {
        var state, providerConfig;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                state = getState();

                if (!state.auth.observingAuthChanges) {
                  _context4.next = 3;
                  break;
                }

                return _context4.abrupt("return");

              case 3:
                if (!tinlake.provider.host) {
                  _context4.next = 6;
                  break;
                }

                if (!providerChecks) {
                  // Found HTTPProvider - check for provider changes every 100 ms'
                  providerChecks = setInterval(function () {
                    return dispatch(observeAuthChanges(tinlake));
                  }, 100);
                }

                return _context4.abrupt("return");

              case 6:
                if (providerChecks) {
                  // 'Provider changed, clear checking'
                  clearInterval(providerChecks);
                  providerConfig = tinlake.provider && tinlake.provider.publicConfigStore && tinlake.provider.publicConfigStore.getState();

                  if (providerConfig) {
                    dispatch(loadUser(tinlake, providerConfig.selectedAddress));
                    dispatch(loadNetwork(providerConfig.networkVersion));
                  } else {
                    dispatch(loadUser(tinlake, tinlake.ethConfig.from));
                  }
                }

                dispatch({
                  type: OBSERVING_AUTH_CHANGES
                });
                tinlake.provider.publicConfigStore.on('update', function (state) {
                  tinlake.ethConfig = {
                    from: state.selectedAddress
                  };
                  dispatch(loadNetwork(state.networkVersion));
                  dispatch(loadUser(tinlake, state.selectedAddress));
                });

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      return function (_x7, _x8) {
        return _ref4.apply(this, arguments);
      };
    }()
  );
}
function clearUser() {
  return (
    /*#__PURE__*/
    function () {
      var _ref5 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee5(dispatch) {
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                dispatch({
                  type: CLEAR
                });

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      return function (_x9) {
        return _ref5.apply(this, arguments);
      };
    }()
  );
}

/***/ }),

/***/ "./ducks/loans.ts":
/*!************************!*\
  !*** ./ducks/loans.ts ***!
  \************************/
/*! exports provided: default, loadLoans, loadLoan */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return reducer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadLoans", function() { return loadLoans; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadLoan", function() { return loadLoan; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");
/* harmony import */ var _services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/tinlake/actions */ "./services/tinlake/actions.ts");
/* harmony import */ var _services_apollo__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/apollo */ "./services/apollo/index.ts");




 // Actions

var LOAD = 'tinlake-ui/loans/LOAD';
var RECEIVE = 'tinlake-ui/loans/RECEIVE';
var LOAD_LOAN = 'tinlake-ui/loans/LOAD_LOAN';
var LOAN_NOT_FOUND = 'tinlake-ui/loans/LOAN_NOT_FOUND';
var RECEIVE_LOAN = 'tinlake-ui/loans/RECEIVE_LOAN';
var initialState = {
  loansState: null,
  loans: [],
  loanState: null,
  loan: null
}; // Reducer

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    type: ''
  };

  switch (action.type) {
    case LOAD:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        loansState: 'loading'
      });

    case RECEIVE:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        loansState: 'found',
        loans: action.loans
      });

    case LOAD_LOAN:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        loanState: 'loading',
        loan: null
      });

    case LOAN_NOT_FOUND:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        loanState: 'not found'
      });

    case RECEIVE_LOAN:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        loanState: 'found',
        loan: action.loan
      });

    default:
      return state;
  }
} // hardcoded root just for testing - will be removed in next pr

function loadLoans(tinlake) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(dispatch) {
        var root, result, loans;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dispatch({
                  type: LOAD
                });
                root = tinlake.contractAddresses["ROOT_CONTRACT"];
                _context.next = 4;
                return _services_apollo__WEBPACK_IMPORTED_MODULE_4__["default"].getLoans(root);

              case 4:
                result = _context.sent;
                loans = result.data;
                dispatch({
                  type: RECEIVE,
                  loans: loans
                });

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()
  );
}
function loadLoan(tinlake, loanId) {
  var refresh = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee2(dispatch) {
        var result;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!refresh) {
                  dispatch({
                    type: LOAD_LOAN
                  });
                }

                _context2.next = 3;
                return Object(_services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__["getLoan"])(tinlake, loanId);

              case 3:
                result = _context2.sent;

                if (!(result.errorMsg || !result.data)) {
                  _context2.next = 7;
                  break;
                }

                dispatch({
                  type: LOAN_NOT_FOUND
                });
                return _context2.abrupt("return");

              case 7:
                dispatch({
                  type: RECEIVE_LOAN,
                  loan: result.data
                });

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
}

/***/ }),

/***/ "./ducks/transactions.ts":
/*!*******************************!*\
  !*** ./ducks/transactions.ts ***!
  \*******************************/
/*! exports provided: default, transactionSubmitted, responseReceived, resetTransactionState */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return reducer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "transactionSubmitted", function() { return transactionSubmitted; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "responseReceived", function() { return responseReceived; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resetTransactionState", function() { return resetTransactionState; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");



// Actions
var TRANSACTION_PROCESSING = 'tinlake-ui/transactions/TRANSCATION_PROCESSING';
var TRANSACTION_SUBMITTED = 'tinlake-ui/transactions/TRANSCATION_SUBMITTED';
var RESET_TRANSACTION_STATE = 'tinlake-ui/transactions/RESET_TRANSACTION_STATE'; // extend by potential error messages

var initialState = {
  transactionState: null,
  loadingMessage: 'transaction processing. Please wait...',
  errorMessage: null,
  successMessage: null
}; // Reducer

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    type: ''
  };

  switch (action.type) {
    case TRANSACTION_PROCESSING:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        transactionState: 'processing',
        successMessage: null,
        errorMessage: null,
        loadingMessage: action.loadingMessage
      });

    case TRANSACTION_SUBMITTED:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        transactionState: 'submitted',
        loadingMessage: null,
        successMessage: action.successMessage,
        errorMessage: action.errorMessage
      });

    case RESET_TRANSACTION_STATE:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        transactionState: null,
        loadingMessage: null,
        successMessage: null,
        errorMessage: null
      });

    default:
      return state;
  }
}
function transactionSubmitted(loadingMessage) {
  return (
    /*#__PURE__*/
    function () {
      var _ref = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(dispatch) {
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dispatch({
                  type: TRANSACTION_PROCESSING,
                  loadingMessage: loadingMessage
                });

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()
  );
}
function responseReceived(successMessage, errorMessage) {
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee2(dispatch) {
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                dispatch({
                  type: TRANSACTION_SUBMITTED,
                  successMessage: successMessage,
                  errorMessage: errorMessage
                });

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
}
function resetTransactionState() {
  return (
    /*#__PURE__*/
    function () {
      var _ref3 = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee3(dispatch) {
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                dispatch({
                  type: RESET_TRANSACTION_STATE
                });

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }()
  );
}

/***/ }),

/***/ "./menuItems.ts":
/*!**********************!*\
  !*** ./menuItems.ts ***!
  \**********************/
/*! exports provided: menuItems */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "menuItems", function() { return menuItems; });
var menuItems = [{
  label: 'Dashboard',
  route: '/',
  env: ''
}, {
  label: 'Loans',
  route: '/loans',
  env: ''
}, {
  label: 'Investments',
  route: '/investments',
  env: ''
}, {
  label: 'Mint NFT',
  route: '/demo/mint-nft',
  env: 'demo'
}];

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/json/stringify.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/json/stringify.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/json/stringify */ "core-js/library/fn/json/stringify");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/assign.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/assign.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/assign */ "core-js/library/fn/object/assign");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/create.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/create.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/create */ "core-js/library/fn/object/create");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/define-properties.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/define-properties.js ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/define-properties */ "core-js/library/fn/object/define-properties");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/define-property.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/define-property.js ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/define-property */ "core-js/library/fn/object/define-property");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/freeze.js":
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/freeze.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/freeze */ "core-js/library/fn/object/freeze");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-descriptor.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-descriptor.js ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/get-own-property-descriptor */ "core-js/library/fn/object/get-own-property-descriptor");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-symbols.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-symbols.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/get-own-property-symbols */ "core-js/library/fn/object/get-own-property-symbols");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/get-prototype-of.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/get-prototype-of.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/get-prototype-of */ "core-js/library/fn/object/get-prototype-of");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/keys.js":
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/keys.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/keys */ "core-js/library/fn/object/keys");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/object/set-prototype-of */ "core-js/library/fn/object/set-prototype-of");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/promise.js":
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/promise.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/promise */ "core-js/library/fn/promise");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/symbol.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/symbol.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/symbol */ "core-js/library/fn/symbol");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/symbol/iterator.js":
/*!************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/symbol/iterator.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/symbol/iterator */ "core-js/library/fn/symbol/iterator");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/assertThisInitialized.js":
/*!******************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/assertThisInitialized.js ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/classCallCheck.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/classCallCheck.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/createClass.js":
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/createClass.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _Object$defineProperty = __webpack_require__(/*! ../core-js/object/define-property */ "./node_modules/@babel/runtime-corejs2/core-js/object/define-property.js");

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;

    _Object$defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js ***!
  \**********************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _assertThisInitialized; });
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js ***!
  \*****************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _asyncToGenerator; });
/* harmony import */ var _core_js_promise__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/promise */ "./node_modules/@babel/runtime-corejs2/core-js/promise.js");
/* harmony import */ var _core_js_promise__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_promise__WEBPACK_IMPORTED_MODULE_0__);


function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    _core_js_promise__WEBPACK_IMPORTED_MODULE_0___default.a.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new _core_js_promise__WEBPACK_IMPORTED_MODULE_0___default.a(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _classCallCheck; });
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js":
/*!************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js ***!
  \************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _createClass; });
/* harmony import */ var _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/define-property */ "./node_modules/@babel/runtime-corejs2/core-js/object/define-property.js");
/* harmony import */ var _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__);


function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;

    _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0___default()(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _defineProperty; });
/* harmony import */ var _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/define-property */ "./node_modules/@babel/runtime-corejs2/core-js/object/define-property.js");
/* harmony import */ var _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0__);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    _core_js_object_define_property__WEBPACK_IMPORTED_MODULE_0___default()(obj, key, {
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

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js":
/*!********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js ***!
  \********************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _extends; });
/* harmony import */ var _core_js_object_assign__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/assign */ "./node_modules/@babel/runtime-corejs2/core-js/object/assign.js");
/* harmony import */ var _core_js_object_assign__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_assign__WEBPACK_IMPORTED_MODULE_0__);

function _extends() {
  _extends = _core_js_object_assign__WEBPACK_IMPORTED_MODULE_0___default.a || function (target) {
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

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _getPrototypeOf; });
/* harmony import */ var _core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/get-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/get-prototype-of.js");
/* harmony import */ var _core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core-js/object/set-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js");
/* harmony import */ var _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_1__);


function _getPrototypeOf(o) {
  _getPrototypeOf = _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_1___default.a ? _core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_0___default.a : function _getPrototypeOf(o) {
    return o.__proto__ || _core_js_object_get_prototype_of__WEBPACK_IMPORTED_MODULE_0___default()(o);
  };
  return _getPrototypeOf(o);
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js ***!
  \*********************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _inherits; });
/* harmony import */ var _core_js_object_create__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/create */ "./node_modules/@babel/runtime-corejs2/core-js/object/create.js");
/* harmony import */ var _core_js_object_create__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_create__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _setPrototypeOf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./setPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/setPrototypeOf.js");


function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = _core_js_object_create__WEBPACK_IMPORTED_MODULE_0___default()(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object(_setPrototypeOf__WEBPACK_IMPORTED_MODULE_1__["default"])(subClass, superClass);
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js ***!
  \*************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _objectSpread; });
/* harmony import */ var _core_js_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/get-own-property-descriptor */ "./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-descriptor.js");
/* harmony import */ var _core_js_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core-js/object/get-own-property-symbols */ "./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-symbols.js");
/* harmony import */ var _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_js_object_keys__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core-js/object/keys */ "./node_modules/@babel/runtime-corejs2/core-js/object/keys.js");
/* harmony import */ var _core_js_object_keys__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_keys__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _defineProperty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./defineProperty */ "./node_modules/@babel/runtime-corejs2/helpers/esm/defineProperty.js");




function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    var ownKeys = _core_js_object_keys__WEBPACK_IMPORTED_MODULE_2___default()(source);

    if (typeof _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_1___default.a === 'function') {
      ownKeys = ownKeys.concat(_core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_1___default()(source).filter(function (sym) {
        return _core_js_object_get_own_property_descriptor__WEBPACK_IMPORTED_MODULE_0___default()(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      Object(_defineProperty__WEBPACK_IMPORTED_MODULE_3__["default"])(target, key, source[key]);
    });
  }

  return target;
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutProperties.js":
/*!************************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutProperties.js ***!
  \************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _objectWithoutProperties; });
/* harmony import */ var _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/get-own-property-symbols */ "./node_modules/@babel/runtime-corejs2/core-js/object/get-own-property-symbols.js");
/* harmony import */ var _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./objectWithoutPropertiesLoose */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutPropertiesLoose.js");


function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = Object(_objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_1__["default"])(source, excluded);
  var key, i;

  if (_core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_0___default.a) {
    var sourceSymbolKeys = _core_js_object_get_own_property_symbols__WEBPACK_IMPORTED_MODULE_0___default()(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutPropertiesLoose.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/objectWithoutPropertiesLoose.js ***!
  \*****************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _objectWithoutPropertiesLoose; });
/* harmony import */ var _core_js_object_keys__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/keys */ "./node_modules/@babel/runtime-corejs2/core-js/object/keys.js");
/* harmony import */ var _core_js_object_keys__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_keys__WEBPACK_IMPORTED_MODULE_0__);

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};

  var sourceKeys = _core_js_object_keys__WEBPACK_IMPORTED_MODULE_0___default()(source);

  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js ***!
  \**************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _possibleConstructorReturn; });
/* harmony import */ var _helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/esm/typeof */ "./node_modules/@babel/runtime-corejs2/helpers/esm/typeof.js");
/* harmony import */ var _assertThisInitialized__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/esm/assertThisInitialized.js");


function _possibleConstructorReturn(self, call) {
  if (call && (Object(_helpers_esm_typeof__WEBPACK_IMPORTED_MODULE_0__["default"])(call) === "object" || typeof call === "function")) {
    return call;
  }

  return Object(_assertThisInitialized__WEBPACK_IMPORTED_MODULE_1__["default"])(self);
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/setPrototypeOf.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/setPrototypeOf.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _setPrototypeOf; });
/* harmony import */ var _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/set-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js");
/* harmony import */ var _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0__);

function _setPrototypeOf(o, p) {
  _setPrototypeOf = _core_js_object_set_prototype_of__WEBPACK_IMPORTED_MODULE_0___default.a || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js ***!
  \**********************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _taggedTemplateLiteral; });
/* harmony import */ var _core_js_object_define_properties__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/object/define-properties */ "./node_modules/@babel/runtime-corejs2/core-js/object/define-properties.js");
/* harmony import */ var _core_js_object_define_properties__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_define_properties__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_object_freeze__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core-js/object/freeze */ "./node_modules/@babel/runtime-corejs2/core-js/object/freeze.js");
/* harmony import */ var _core_js_object_freeze__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_object_freeze__WEBPACK_IMPORTED_MODULE_1__);


function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  return _core_js_object_freeze__WEBPACK_IMPORTED_MODULE_1___default()(_core_js_object_define_properties__WEBPACK_IMPORTED_MODULE_0___default()(strings, {
    raw: {
      value: _core_js_object_freeze__WEBPACK_IMPORTED_MODULE_1___default()(raw)
    }
  }));
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/typeof.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/typeof.js ***!
  \*******************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _typeof; });
/* harmony import */ var _core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/symbol/iterator */ "./node_modules/@babel/runtime-corejs2/core-js/symbol/iterator.js");
/* harmony import */ var _core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_symbol__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core-js/symbol */ "./node_modules/@babel/runtime-corejs2/core-js/symbol.js");
/* harmony import */ var _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_symbol__WEBPACK_IMPORTED_MODULE_1__);



function _typeof2(obj) { if (typeof _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a === "function" && typeof _core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_0___default.a === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a === "function" && obj.constructor === _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a && obj !== _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a === "function" && _typeof2(_core_js_symbol_iterator__WEBPACK_IMPORTED_MODULE_0___default.a) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a === "function" && obj.constructor === _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a && obj !== _core_js_symbol__WEBPACK_IMPORTED_MODULE_1___default.a.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/getPrototypeOf.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/getPrototypeOf.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _Object$getPrototypeOf = __webpack_require__(/*! ../core-js/object/get-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/get-prototype-of.js");

var _Object$setPrototypeOf = __webpack_require__(/*! ../core-js/object/set-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js");

function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = _Object$setPrototypeOf ? _Object$getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || _Object$getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/inherits.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/inherits.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _Object$create = __webpack_require__(/*! ../core-js/object/create */ "./node_modules/@babel/runtime-corejs2/core-js/object/create.js");

var setPrototypeOf = __webpack_require__(/*! ./setPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/setPrototypeOf.js");

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = _Object$create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

module.exports = _inherits;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/interopRequireDefault.js":
/*!******************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/interopRequireDefault.js ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

module.exports = _interopRequireDefault;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/possibleConstructorReturn.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/possibleConstructorReturn.js ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(/*! ../helpers/typeof */ "./node_modules/@babel/runtime-corejs2/helpers/typeof.js");

var assertThisInitialized = __webpack_require__(/*! ./assertThisInitialized */ "./node_modules/@babel/runtime-corejs2/helpers/assertThisInitialized.js");

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/setPrototypeOf.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/setPrototypeOf.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _Object$setPrototypeOf = __webpack_require__(/*! ../core-js/object/set-prototype-of */ "./node_modules/@babel/runtime-corejs2/core-js/object/set-prototype-of.js");

function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = _Object$setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/typeof.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/typeof.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _Symbol$iterator = __webpack_require__(/*! ../core-js/symbol/iterator */ "./node_modules/@babel/runtime-corejs2/core-js/symbol/iterator.js");

var _Symbol = __webpack_require__(/*! ../core-js/symbol */ "./node_modules/@babel/runtime-corejs2/core-js/symbol.js");

function _typeof2(obj) { if (typeof _Symbol === "function" && typeof _Symbol$iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof _Symbol === "function" && obj.constructor === _Symbol && obj !== _Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof _Symbol === "function" && _typeof2(_Symbol$iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof _Symbol === "function" && obj.constructor === _Symbol && obj !== _Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/regenerator/index.js":
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/regenerator/index.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! regenerator-runtime */ "regenerator-runtime");


/***/ }),

/***/ "./node_modules/next/dist/client/link.js":
/*!***********************************************!*\
  !*** ./node_modules/next/dist/client/link.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* global __NEXT_DATA__ */

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime-corejs2/helpers/interopRequireDefault */ "./node_modules/@babel/runtime-corejs2/helpers/interopRequireDefault.js");

var _stringify = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/core-js/json/stringify */ "./node_modules/@babel/runtime-corejs2/core-js/json/stringify.js"));

var _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/helpers/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/classCallCheck.js"));

var _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/helpers/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/createClass.js"));

var _possibleConstructorReturn2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/helpers/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/possibleConstructorReturn.js"));

var _getPrototypeOf2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/helpers/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/getPrototypeOf.js"));

var _inherits2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/helpers/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/inherits.js"));

var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result["default"] = mod;
  return result;
};

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var url_1 = __webpack_require__(/*! url */ "url");

var react_1 = __importStar(__webpack_require__(/*! react */ "react"));

var prop_types_1 = __importDefault(__webpack_require__(/*! prop-types */ "prop-types"));

var router_1 = __importStar(__webpack_require__(/*! next/router */ "next/router"));

var utils_1 = __webpack_require__(/*! next-server/dist/lib/utils */ "next-server/dist/lib/utils");

function isLocal(href) {
  var url = url_1.parse(href, false, true);
  var origin = url_1.parse(utils_1.getLocationOrigin(), false, true);
  return !url.host || url.protocol === origin.protocol && url.host === origin.host;
}

function memoizedFormatUrl(formatFunc) {
  var lastHref = null;
  var lastAs = null;
  var lastResult = null;
  return function (href, as) {
    if (href === lastHref && as === lastAs) {
      return lastResult;
    }

    var result = formatFunc(href, as);
    lastHref = href;
    lastAs = as;
    lastResult = result;
    return result;
  };
}

function formatUrl(url) {
  return url && typeof url === 'object' ? utils_1.formatWithValidation(url) : url;
}

var Link =
/*#__PURE__*/
function (_react_1$Component) {
  (0, _inherits2.default)(Link, _react_1$Component);

  function Link() {
    var _this;

    (0, _classCallCheck2.default)(this, Link);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Link).apply(this, arguments)); // The function is memoized so that no extra lifecycles are needed
    // as per https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html

    _this.formatUrls = memoizedFormatUrl(function (href, asHref) {
      return {
        href: formatUrl(href),
        as: formatUrl(asHref, true)
      };
    });

    _this.linkClicked = function (e) {
      var _e$currentTarget = e.currentTarget,
          nodeName = _e$currentTarget.nodeName,
          target = _e$currentTarget.target;

      if (nodeName === 'A' && (target && target !== '_self' || e.metaKey || e.ctrlKey || e.shiftKey || e.nativeEvent && e.nativeEvent.which === 2)) {
        // ignore click for new tab / new window behavior
        return;
      }

      var _this$formatUrls = _this.formatUrls(_this.props.href, _this.props.as),
          href = _this$formatUrls.href,
          as = _this$formatUrls.as;

      if (!isLocal(href)) {
        // ignore click if it's outside our scope
        return;
      }

      var pathname = window.location.pathname;
      href = url_1.resolve(pathname, href);
      as = as ? url_1.resolve(pathname, as) : href;
      e.preventDefault(); //  avoid scroll for urls with anchor refs

      var scroll = _this.props.scroll;

      if (scroll == null) {
        scroll = as.indexOf('#') < 0;
      } // replace state instead of push if prop is present


      router_1.default[_this.props.replace ? 'replace' : 'push'](href, as, {
        shallow: _this.props.shallow
      }).then(function (success) {
        if (!success) return;

        if (scroll) {
          window.scrollTo(0, 0);
          document.body.focus();
        }
      }).catch(function (err) {
        if (_this.props.onError) _this.props.onError(err);
      });
    };

    return _this;
  }

  (0, _createClass2.default)(Link, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.prefetch();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if ((0, _stringify.default)(this.props.href) !== (0, _stringify.default)(prevProps.href)) {
        this.prefetch();
      }
    }
  }, {
    key: "prefetch",
    value: function prefetch() {
      if (!this.props.prefetch) return;
      if (typeof window === 'undefined') return; // Prefetch the JSON page if asked (only in the client)

      var pathname = window.location.pathname;

      var _this$formatUrls2 = this.formatUrls(this.props.href, this.props.as),
          parsedHref = _this$formatUrls2.href;

      var href = url_1.resolve(pathname, parsedHref);
      router_1.default.prefetch(href);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var children = this.props.children;

      var _this$formatUrls3 = this.formatUrls(this.props.href, this.props.as),
          href = _this$formatUrls3.href,
          as = _this$formatUrls3.as; // Deprecated. Warning shown by propType check. If the childen provided is a string (<Link>example</Link>) we wrap it in an <a> tag


      if (typeof children === 'string') {
        children = react_1.default.createElement("a", null, children);
      } // This will return the first child, if multiple are provided it will throw an error


      var child = react_1.Children.only(children);
      var props = {
        onClick: function onClick(e) {
          if (child.props && typeof child.props.onClick === 'function') {
            child.props.onClick(e);
          }

          if (!e.defaultPrevented) {
            _this2.linkClicked(e);
          }
        }
      }; // If child is an <a> tag and doesn't have a href attribute, or if the 'passHref' property is
      // defined, we specify the current 'href', so that repetition is not needed by the user

      if (this.props.passHref || child.type === 'a' && !('href' in child.props)) {
        props.href = as || href;
      } // Add the ending slash to the paths. So, we can serve the
      // "<page>/index.html" directly.


      if (true) {
        if (props.href && typeof __NEXT_DATA__ !== 'undefined' && __NEXT_DATA__.nextExport) {
          props.href = router_1.Router._rewriteUrlForNextExport(props.href);
        }
      }

      return react_1.default.cloneElement(child, props);
    }
  }]);
  return Link;
}(react_1.Component);

if (true) {
  var warn = utils_1.execOnce(console.error); // This module gets removed by webpack.IgnorePlugin

  var exact = __webpack_require__(/*! prop-types-exact */ "prop-types-exact");

  Link.propTypes = exact({
    href: prop_types_1.default.oneOfType([prop_types_1.default.string, prop_types_1.default.object]).isRequired,
    as: prop_types_1.default.oneOfType([prop_types_1.default.string, prop_types_1.default.object]),
    prefetch: prop_types_1.default.bool,
    replace: prop_types_1.default.bool,
    shallow: prop_types_1.default.bool,
    passHref: prop_types_1.default.bool,
    scroll: prop_types_1.default.bool,
    children: prop_types_1.default.oneOfType([prop_types_1.default.element, function (props, propName) {
      var value = props[propName];

      if (typeof value === 'string') {
        warn("Warning: You're using a string directly inside <Link>. This usage has been deprecated. Please add an <a> tag as child of <Link>");
      }

      return null;
    }]).isRequired
  });
}

exports.default = Link;

/***/ }),

/***/ "./node_modules/next/link.js":
/*!***********************************!*\
  !*** ./node_modules/next/link.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./dist/client/link */ "./node_modules/next/dist/client/link.js")


/***/ }),

/***/ "./pages/loans/loan.tsx":
/*!******************************!*\
  !*** ./pages/loans/loan.tsx ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _components_WithTinlake__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../components/WithTinlake */ "./components/WithTinlake/index.tsx");
/* harmony import */ var _containers_Loan_View__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../containers/Loan/View */ "./containers/Loan/View/index.tsx");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! grommet */ "grommet");
/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _components_Header__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../components/Header */ "./components/Header/index.tsx");
/* harmony import */ var _components_SecondaryHeader__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../components/SecondaryHeader */ "./components/SecondaryHeader/index.tsx");
/* harmony import */ var _menuItems__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../menuItems */ "./menuItems.ts");
/* harmony import */ var _components_BackLink__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../components/BackLink */ "./components/BackLink/index.tsx");
/* harmony import */ var _components_Auth__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../components/Auth */ "./components/Auth/index.tsx");
/* harmony import */ var _components_Alert__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../components/Alert */ "./components/Alert/index.tsx");







var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/pages/loans/loan.tsx";











var LoanPage =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_6__["default"])(LoanPage, _React$Component);

  function LoanPage() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_2__["default"])(this, LoanPage);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_4__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_5__["default"])(LoanPage).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_3__["default"])(LoanPage, [{
    key: "render",
    value: function render() {
      var loanId = this.props.loanId;
      return react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        align: "center",
        pad: {
          horizontal: "small"
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 23
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_Header__WEBPACK_IMPORTED_MODULE_11__["default"], {
        selectedRoute: '/loans/loan',
        menuItems: _menuItems__WEBPACK_IMPORTED_MODULE_13__["menuItems"],
        __source: {
          fileName: _jsxFileName,
          lineNumber: 24
        },
        __self: this
      }), react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        justify: "center",
        direction: "row",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 28
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        width: "xlarge",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 32
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_SecondaryHeader__WEBPACK_IMPORTED_MODULE_12__["default"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 33
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
        direction: "row",
        gap: "small",
        align: "center",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 34
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_BackLink__WEBPACK_IMPORTED_MODULE_14__["BackLink"], {
        href: '/loans',
        __source: {
          fileName: _jsxFileName,
          lineNumber: 35
        },
        __self: this
      }), react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Heading"], {
        level: "3",
        __source: {
          fileName: _jsxFileName,
          lineNumber: 36
        },
        __self: this
      }, "Loan Details"))), react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_WithTinlake__WEBPACK_IMPORTED_MODULE_8__["default"], {
        render: function render(tinlake) {
          return react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_Auth__WEBPACK_IMPORTED_MODULE_15__["default"], {
            tinlake: tinlake,
            waitForAuthentication: true,
            waitForAuthorization: true,
            render: function render(auth) {
              return auth && auth.state === 'loaded' && auth.user ? react__WEBPACK_IMPORTED_MODULE_7__["createElement"](grommet__WEBPACK_IMPORTED_MODULE_10__["Box"], {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 42
                },
                __self: this
              }, " ", loanId && react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_containers_Loan_View__WEBPACK_IMPORTED_MODULE_9__["default"], {
                auth: auth,
                tinlake: tinlake,
                loanId: loanId,
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 42
                },
                __self: this
              }), " ") : react__WEBPACK_IMPORTED_MODULE_7__["createElement"](_components_Alert__WEBPACK_IMPORTED_MODULE_16__["default"], {
                margin: "medium",
                type: "error",
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 44
                },
                __self: this
              }, "Please authenticate to access this page ");
            },
            __source: {
              fileName: _jsxFileName,
              lineNumber: 40
            },
            __self: this
          });
        },
        __source: {
          fileName: _jsxFileName,
          lineNumber: 39
        },
        __self: this
      }))));
    }
  }], [{
    key: "getInitialProps",
    value: function () {
      var _getInitialProps = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(_ref) {
        var query;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                query = _ref.query;
                return _context.abrupt("return", {
                  loanId: query.loanId
                });

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function getInitialProps(_x) {
        return _getInitialProps.apply(this, arguments);
      }

      return getInitialProps;
    }()
  }]);

  return LoanPage;
}(react__WEBPACK_IMPORTED_MODULE_7__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (LoanPage);

/***/ }),

/***/ "./services/apollo/index.ts":
/*!**********************************!*\
  !*** ./services/apollo/index.ts ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var apollo_client__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! apollo-client */ "apollo-client");
/* harmony import */ var apollo_client__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(apollo_client__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var apollo_cache_inmemory__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! apollo-cache-inmemory */ "apollo-cache-inmemory");
/* harmony import */ var apollo_cache_inmemory__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(apollo_cache_inmemory__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var apollo_link_http__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! apollo-link-http */ "apollo-link-http");
/* harmony import */ var apollo_link_http__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(apollo_link_http__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../config */ "./config.ts");
/* harmony import */ var node_fetch__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! node-fetch */ "node-fetch");
/* harmony import */ var node_fetch__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(node_fetch__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var graphql_tag__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! graphql-tag */ "graphql-tag");
/* harmony import */ var graphql_tag__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(graphql_tag__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! bn.js */ "bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_11__);






function _templateObject2() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_1__["default"])(["\n        {\n          proxies (where: {owner:\"", "\"})\n            {\n              id\n              owner\n            }\n          }\n        "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_1__["default"])(["\n        {\n          pools (where : {id: \"", "\"}){\n            id\n            loans {\n              id\n              pool {\n                id\n              }\n              index\n              owner\n              opened\n              closed\n              debt\n              interestRatePerSecond\n              ceiling\n              threshold\n              borrowsCount\n              borrowsAggregatedAmount\n              repaysCount\n              repaysAggregatedAmount\n              nftId\n              nftRegistry\n            }\n          }\n        }\n        "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}








var tinlakeDataBackendUrl = _config__WEBPACK_IMPORTED_MODULE_8__["default"].tinlakeDataBackendUrl;
var cache = new apollo_cache_inmemory__WEBPACK_IMPORTED_MODULE_6__["InMemoryCache"]();
var link = new apollo_link_http__WEBPACK_IMPORTED_MODULE_7__["createHttpLink"]({
  fetch: node_fetch__WEBPACK_IMPORTED_MODULE_9___default.a,
  headers: {
    "user-agent": null
  },
  // fetchOptions: '',
  uri: tinlakeDataBackendUrl
});
var defaultOptions = {
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  }
};

var Apollo =
/*#__PURE__*/
function () {
  function Apollo() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_3__["default"])(this, Apollo);

    this.client = new apollo_client__WEBPACK_IMPORTED_MODULE_5__["ApolloClient"]({
      cache: cache,
      link: link,
      defaultOptions: defaultOptions
    });
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_4__["default"])(Apollo, [{
    key: "getLoans",
    value: function () {
      var _getLoans = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(root) {
        var result, pool, tinlakeLoans;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return this.client.query({
                  query: graphql_tag__WEBPACK_IMPORTED_MODULE_10___default()(_templateObject(), root)
                });

              case 3:
                result = _context.sent;
                _context.next = 10;
                break;

              case 6:
                _context.prev = 6;
                _context.t0 = _context["catch"](0);
                console.log("error occured while fetching loans from apollo ".concat(_context.t0));
                return _context.abrupt("return", {
                  data: []
                });

              case 10:
                pool = result.data.pools[0];
                tinlakeLoans = pool && toTinlakeLoans(pool.loans) || [];
                return _context.abrupt("return", tinlakeLoans);

              case 13:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 6]]);
      }));

      function getLoans(_x) {
        return _getLoans.apply(this, arguments);
      }

      return getLoans;
    }()
  }, {
    key: "getProxies",
    value: function () {
      var _getProxies = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee2(user) {
        var result, proxies;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return this.client.query({
                  query: graphql_tag__WEBPACK_IMPORTED_MODULE_10___default()(_templateObject2(), user)
                });

              case 3:
                result = _context2.sent;
                _context2.next = 10;
                break;

              case 6:
                _context2.prev = 6;
                _context2.t0 = _context2["catch"](0);
                console.log("no proxies found for address ".concat(user, " ").concat(_context2.t0));
                return _context2.abrupt("return", {
                  data: []
                });

              case 10:
                proxies = result.data.proxies.map(function (e) {
                  return e.id;
                });
                return _context2.abrupt("return", {
                  data: proxies
                });

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 6]]);
      }));

      function getProxies(_x2) {
        return _getProxies.apply(this, arguments);
      }

      return getProxies;
    }()
  }]);

  return Apollo;
}();

function toTinlakeLoans(loans) {
  var tinlakeLoans = [];
  loans.forEach(function (loan) {
    var tinlakeLoan = {
      loanId: loan.index,
      registry: loan.nftRegistry,
      tokenId: new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(loan.nftId),
      principal: loan.ceiling ? new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(loan.ceiling) : new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(0),
      ownerOf: loan.owner,
      interestRate: loan.interestRatePerSecond ? new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(loan.interestRatePerSecond) : new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(0),
      debt: new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(loan.debt),
      threshold: loan.threshold ? new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(loan.threshold) : new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(0),
      price: loan.price || new bn_js__WEBPACK_IMPORTED_MODULE_11___default.a(0),
      status: getLoanStatus(loan)
    };
    tinlakeLoans.push(tinlakeLoan);
  });
  tinlakeLoans.length && tinlakeLoans.sort(function (l1, l2) {
    return l1.loanId - l2.loanId;
  });
  return {
    data: tinlakeLoans
  };
}

function getLoanStatus(loan) {
  if (loan.closed) {
    return "closed";
  } else if (loan.debt && loan.debt !== "0") {
    return "ongoing";
  }

  return "opened";
}

/* harmony default export */ __webpack_exports__["default"] = (new Apollo());

/***/ }),

/***/ "./services/tinlake/actions.ts":
/*!*************************************!*\
  !*** ./services/tinlake/actions.ts ***!
  \*************************************/
/*! exports provided: getNFT, issue, getProxyOwner, getLoan, getLoans, setInterest, getAnalytics, borrow, repay, getInvestor, setAllowance, setMinJuniorRatio, supply, redeem */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getNFT", function() { return getNFT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "issue", function() { return issue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getProxyOwner", function() { return getProxyOwner; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLoan", function() { return getLoan; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLoans", function() { return getLoans; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setInterest", function() { return setInterest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAnalytics", function() { return getAnalytics; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "borrow", function() { return borrow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "repay", function() { return repay; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getInvestor", function() { return getInvestor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAllowance", function() { return setAllowance; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setMinJuniorRatio", function() { return setMinJuniorRatio; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "supply", function() { return supply; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "redeem", function() { return redeem; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bn.js */ "bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_3__);




var ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
var SUCCESS_STATUS = '0x1';
function getNFT(_x, _x2, _x3) {
  return _getNFT.apply(this, arguments);
}

function _getNFT() {
  _getNFT = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(registry, tinlake, tokenId) {
    var nftOwner, nftData, replacedTokenId, bnTokenId, nft;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return tinlake.getOwnerOfCollateral(registry, tokenId);

          case 3:
            nftOwner = _context.sent;
            _context.next = 9;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);
            return _context.abrupt("return", loggedError(_context.t0, 'Could not get NFT owner for NFT ID', tokenId));

          case 9:
            if (nftOwner) {
              _context.next = 11;
              break;
            }

            return _context.abrupt("return", loggedError({}, 'Could not get NFT owner for NFT ID', tokenId));

          case 11:
            _context.prev = 11;
            _context.next = 14;
            return tinlake.getNFTData(registry, tokenId);

          case 14:
            nftData = _context.sent;
            _context.next = 20;
            break;

          case 17:
            _context.prev = 17;
            _context.t1 = _context["catch"](11);
            // return loggedError(e, 'Could not get NFT data for NFT ID', tokenId);
            nftData = null;

          case 20:
            replacedTokenId = tokenId.replace(/^0x/, '');
            bnTokenId = new bn_js__WEBPACK_IMPORTED_MODULE_2___default.a(replacedTokenId);
            nft = {
              nftOwner: nftOwner,
              nftData: nftData,
              registry: registry,
              tokenId: bnTokenId
            };
            return _context.abrupt("return", {
              nft: nft,
              tokenId: tokenId
            });

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 6], [11, 17]]);
  }));
  return _getNFT.apply(this, arguments);
}

function issue(_x4, _x5, _x6) {
  return _issue.apply(this, arguments);
}

function _issue() {
  _issue = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee2(tinlake, tokenId, nftRegistryAddress) {
    var proxyAddress, address, result, loanId;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            address = tinlake.ethConfig.from;
            _context2.prev = 1;
            _context2.next = 4;
            return tinlake.checkProxyExists(address);

          case 4:
            proxyAddress = _context2.sent;
            console.log('proxy found', proxyAddress);
            _context2.next = 11;
            break;

          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2["catch"](1);
            proxyAddress = null;

          case 11:
            if (proxyAddress) {
              _context2.next = 22;
              break;
            }

            _context2.prev = 12;
            _context2.next = 15;
            return tinlake.proxyCreateNew(address);

          case 15:
            proxyAddress = _context2.sent;
            console.log('proxy not found, new proxy address', proxyAddress);
            _context2.next = 22;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t1 = _context2["catch"](12);
            return _context2.abrupt("return", loggedError(_context2.t1, 'Could not create Proxy.', address));

          case 22:
            if (proxyAddress) {
              _context2.next = 24;
              break;
            }

            return _context2.abrupt("return", loggedError(null, 'Could not create Proxy.', address));

          case 24:
            _context2.prev = 24;
            _context2.next = 27;
            return tinlake.approveNFT(nftRegistryAddress, tokenId, proxyAddress);

          case 27:
            _context2.next = 32;
            break;

          case 29:
            _context2.prev = 29;
            _context2.t2 = _context2["catch"](24);
            return _context2.abrupt("return", loggedError(_context2.t2, 'Could not approve proxy to take NFT.', tokenId));

          case 32:
            _context2.prev = 32;
            _context2.next = 35;
            return tinlake.proxyTransferIssue(proxyAddress, nftRegistryAddress, tokenId);

          case 35:
            result = _context2.sent;
            _context2.next = 41;
            break;

          case 38:
            _context2.prev = 38;
            _context2.t3 = _context2["catch"](32);
            return _context2.abrupt("return", loggedError(_context2.t3, 'Could not Issue loan.', tokenId));

          case 41:
            if (!(result.status !== SUCCESS_STATUS)) {
              _context2.next = 43;
              break;
            }

            return _context2.abrupt("return", loggedError({}, 'Could not Issue loan.', tokenId));

          case 43:
            _context2.next = 45;
            return tinlake.nftLookup(nftRegistryAddress, tokenId);

          case 45:
            loanId = _context2.sent;
            return _context2.abrupt("return", {
              data: loanId
            });

          case 47:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[1, 8], [12, 19], [24, 29], [32, 38]]);
  }));
  return _issue.apply(this, arguments);
}

function getProxyOwner(_x7, _x8) {
  return _getProxyOwner.apply(this, arguments);
}

function _getProxyOwner() {
  _getProxyOwner = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee3(tinlake, loanId) {
    var owner;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            owner = ZERO_ADDRESS;
            _context3.prev = 1;
            _context3.next = 4;
            return tinlake.getProxyOwnerByLoan(loanId);

          case 4:
            owner = _context3.sent;
            _context3.next = 9;
            break;

          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3["catch"](1);

          case 9:
            return _context3.abrupt("return", {
              data: owner
            });

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[1, 7]]);
  }));
  return _getProxyOwner.apply(this, arguments);
}

function getLoan(_x9, _x10) {
  return _getLoan.apply(this, arguments);
}

function _getLoan() {
  _getLoan = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee4(tinlake, loanId) {
    var loan, count, nftData;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return tinlake.loanCount();

          case 2:
            count = _context4.sent;

            if (!(count.toNumber() <= Number(loanId) || Number(loanId) === 0)) {
              _context4.next = 5;
              break;
            }

            return _context4.abrupt("return", loggedError({}, 'Loan not found', loanId));

          case 5:
            _context4.prev = 5;
            _context4.next = 8;
            return tinlake.getLoan(loanId);

          case 8:
            loan = _context4.sent;
            _context4.next = 14;
            break;

          case 11:
            _context4.prev = 11;
            _context4.t0 = _context4["catch"](5);
            return _context4.abrupt("return", loggedError(_context4.t0, 'Loan not found', loanId));

          case 14:
            _context4.next = 16;
            return getNFT(loan.registry, tinlake, "".concat(loan.tokenId));

          case 16:
            nftData = _context4.sent;
            loan.nft = nftData && nftData.nft || {};
            _context4.next = 20;
            return addProxyDetails(tinlake, loan);

          case 20:
            return _context4.abrupt("return", {
              data: loan
            });

          case 21:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[5, 11]]);
  }));
  return _getLoan.apply(this, arguments);
}

function addProxyDetails(_x11, _x12) {
  return _addProxyDetails.apply(this, arguments);
}

function _addProxyDetails() {
  _addProxyDetails = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee5(tinlake, loan) {
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return tinlake.getProxyOwnerByLoan(loan.loanId);

          case 3:
            loan.proxyOwner = _context5.sent;
            _context5.next = 8;
            break;

          case 6:
            _context5.prev = 6;
            _context5.t0 = _context5["catch"](0);

          case 8:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[0, 6]]);
  }));
  return _addProxyDetails.apply(this, arguments);
}

function getLoans(_x13) {
  return _getLoans.apply(this, arguments);
}

function _getLoans() {
  _getLoans = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee6(tinlake) {
    var loans, loansList, i, loan;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return tinlake.getLoanList();

          case 3:
            loans = _context6.sent;
            _context6.next = 9;
            break;

          case 6:
            _context6.prev = 6;
            _context6.t0 = _context6["catch"](0);
            return _context6.abrupt("return", loggedError(_context6.t0, 'Could not get loans', ''));

          case 9:
            loansList = [];
            i = 0;

          case 11:
            if (!(i < loans.length)) {
              _context6.next = 19;
              break;
            }

            loan = loans[i];
            _context6.next = 15;
            return addProxyDetails(tinlake, loan);

          case 15:
            loansList.push(loan);

          case 16:
            i += 1;
            _context6.next = 11;
            break;

          case 19:
            return _context6.abrupt("return", {
              data: loansList
            });

          case 20:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[0, 6]]);
  }));
  return _getLoans.apply(this, arguments);
}

function setInterest(_x14, _x15, _x16, _x17) {
  return _setInterest.apply(this, arguments);
}

function _setInterest() {
  _setInterest = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee7(tinlake, loanId, debt, rate) {
    var rateGroup, existsRateGroup, initRes, setRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            rateGroup = Object(tinlake__WEBPACK_IMPORTED_MODULE_3__["interestRateToFee"])(rate);
            _context7.next = 3;
            return tinlake.existsRateGroup(rateGroup);

          case 3:
            existsRateGroup = _context7.sent;

            if (existsRateGroup) {
              _context7.next = 16;
              break;
            }

            _context7.prev = 5;
            _context7.next = 8;
            return tinlake.initRate(rateGroup);

          case 8:
            initRes = _context7.sent;
            _context7.next = 14;
            break;

          case 11:
            _context7.prev = 11;
            _context7.t0 = _context7["catch"](5);
            return _context7.abrupt("return", loggedError(_context7.t0, 'Could not init rate group', loanId));

          case 14:
            if (!(initRes.status !== SUCCESS_STATUS)) {
              _context7.next = 16;
              break;
            }

            return _context7.abrupt("return", loggedError({}, 'Could not init rate group', loanId));

          case 16:
            _context7.prev = 16;

            if (!(debt.toString() === '0')) {
              _context7.next = 23;
              break;
            }

            _context7.next = 20;
            return tinlake.setRate(loanId, rateGroup);

          case 20:
            setRes = _context7.sent;
            _context7.next = 26;
            break;

          case 23:
            _context7.next = 25;
            return tinlake.changeRate(loanId, rateGroup);

          case 25:
            setRes = _context7.sent;

          case 26:
            _context7.next = 31;
            break;

          case 28:
            _context7.prev = 28;
            _context7.t1 = _context7["catch"](16);
            return _context7.abrupt("return", loggedError(_context7.t1, 'Could not set rate group', loanId));

          case 31:
            if (!(setRes.status !== SUCCESS_STATUS)) {
              _context7.next = 33;
              break;
            }

            return _context7.abrupt("return", loggedError({}, 'Could not set rate group', loanId));

          case 33:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[5, 11], [16, 28]]);
  }));
  return _setInterest.apply(this, arguments);
}

function getAnalytics(_x18) {
  return _getAnalytics.apply(this, arguments);
}

function _getAnalytics() {
  _getAnalytics = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee8(tinlake) {
    var juniorReserve, juniorTokenPrice, seniorReserve, seniorTokenPrice, seniorInterestRate, minJuniorRatio, juniorAssetValue, currentJuniorRatio;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return tinlake.getJuniorReserve();

          case 2:
            juniorReserve = _context8.sent;
            _context8.next = 5;
            return tinlake.getTokenPriceJunior();

          case 5:
            juniorTokenPrice = _context8.sent;
            _context8.next = 8;
            return tinlake.getSeniorReserve();

          case 8:
            seniorReserve = _context8.sent;
            _context8.next = 11;
            return tinlake.getTokenPriceSenior(tinlake.ethConfig.from);

          case 11:
            seniorTokenPrice = _context8.sent;
            _context8.next = 14;
            return tinlake.getSeniorInterestRate();

          case 14:
            seniorInterestRate = _context8.sent;
            _context8.next = 17;
            return tinlake.getMinJuniorRatio();

          case 17:
            minJuniorRatio = _context8.sent;
            _context8.next = 20;
            return tinlake.getAssetValueJunior();

          case 20:
            juniorAssetValue = _context8.sent;

            if (!(juniorAssetValue.toString() === '0')) {
              _context8.next = 25;
              break;
            }

            _context8.t0 = new bn_js__WEBPACK_IMPORTED_MODULE_2___default.a(0);
            _context8.next = 28;
            break;

          case 25:
            _context8.next = 27;
            return tinlake.getCurrentJuniorRatio();

          case 27:
            _context8.t0 = _context8.sent;

          case 28:
            currentJuniorRatio = _context8.t0;
            _context8.prev = 29;
            return _context8.abrupt("return", {
              data: {
                junior: {
                  type: "junior",
                  availableFunds: juniorReserve,
                  tokenPrice: juniorTokenPrice,
                  token: "TIN"
                },
                senior: {
                  type: "senior",
                  availableFunds: seniorReserve,
                  tokenPrice: seniorTokenPrice,
                  token: "DROP",
                  interestRate: seniorInterestRate
                },
                availableFunds: juniorReserve.add(seniorReserve),
                minJuniorRatio: minJuniorRatio,
                currentJuniorRatio: currentJuniorRatio
              }
            });

          case 33:
            _context8.prev = 33;
            _context8.t1 = _context8["catch"](29);
            return _context8.abrupt("return", loggedError(_context8.t1, 'Could not get analytics data', ''));

          case 36:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[29, 33]]);
  }));
  return _getAnalytics.apply(this, arguments);
}

function borrow(_x19, _x20, _x21) {
  return _borrow.apply(this, arguments);
} // repay full loan debt

function _borrow() {
  _borrow = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee9(tinlake, loan, amount) {
    var loanId, address, proxy, juniorReserve, seniorReserve, trancheReserve, borrowRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            loanId = loan.loanId;
            address = tinlake.ethConfig.from;
            proxy = loan.ownerOf; // make sure tranche has enough funds

            _context9.next = 5;
            return tinlake.getJuniorReserve();

          case 5:
            juniorReserve = _context9.sent;
            _context9.next = 8;
            return tinlake.getSeniorReserve();

          case 8:
            seniorReserve = _context9.sent;
            trancheReserve = juniorReserve.add(seniorReserve);

            if (!(new bn_js__WEBPACK_IMPORTED_MODULE_2___default.a(amount).cmp(trancheReserve) > 0)) {
              _context9.next = 12;
              break;
            }

            return _context9.abrupt("return", loggedError({}, 'There is not enough available funds.', loanId));

          case 12:
            _context9.prev = 12;
            _context9.next = 15;
            return tinlake.proxyLockBorrowWithdraw(proxy, loanId, amount, address);

          case 15:
            borrowRes = _context9.sent;
            _context9.next = 21;
            break;

          case 18:
            _context9.prev = 18;
            _context9.t0 = _context9["catch"](12);
            return _context9.abrupt("return", loggedError(_context9.t0, 'Could not borrow.', loanId));

          case 21:
            if (!(borrowRes.status !== SUCCESS_STATUS)) {
              _context9.next = 23;
              break;
            }

            return _context9.abrupt("return", loggedError({}, 'Could not borrow', loanId));

          case 23:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[12, 18]]);
  }));
  return _borrow.apply(this, arguments);
}

function repay(_x22, _x23) {
  return _repay.apply(this, arguments);
}

function _repay() {
  _repay = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee10(tinlake, loan) {
    var loanId, proxy, approvalAmount, approveRes, repayRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            loanId = loan.loanId;
            proxy = loan.ownerOf; // user entrie user balance as repay amount to make sure that enough funds are provided to cover the entire debt

            _context10.next = 4;
            return tinlake.getCurrencyBalance(tinlake.ethConfig.from);

          case 4:
            approvalAmount = _context10.sent;
            _context10.prev = 5;
            _context10.next = 8;
            return tinlake.approveCurrency(proxy, approvalAmount);

          case 8:
            approveRes = _context10.sent;
            _context10.next = 14;
            break;

          case 11:
            _context10.prev = 11;
            _context10.t0 = _context10["catch"](5);
            return _context10.abrupt("return", loggedError(_context10.t0, 'Could not approve proxy.', loanId));

          case 14:
            if (!(approveRes.status !== SUCCESS_STATUS)) {
              _context10.next = 16;
              break;
            }

            return _context10.abrupt("return", loggedError({
              response: approveRes
            }, 'Could not approve proxy', loanId));

          case 16:
            _context10.prev = 16;
            _context10.next = 19;
            return tinlake.proxyRepayUnlockClose(proxy, loan.tokenId, loanId, loan.registry);

          case 19:
            repayRes = _context10.sent;
            _context10.next = 25;
            break;

          case 22:
            _context10.prev = 22;
            _context10.t1 = _context10["catch"](16);
            return _context10.abrupt("return", loggedError(_context10.t1, 'Could not repay.', loanId));

          case 25:
            if (!(repayRes.status !== SUCCESS_STATUS)) {
              _context10.next = 27;
              break;
            }

            return _context10.abrupt("return", loggedError({
              response: repayRes
            }, 'Could not repay', loanId));

          case 27:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, null, [[5, 11], [16, 22]]);
  }));
  return _repay.apply(this, arguments);
}

function getInvestor(_x24, _x25) {
  return _getInvestor.apply(this, arguments);
}

function _getInvestor() {
  _getInvestor = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee11(tinlake, address) {
    var investor;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;
            _context11.next = 3;
            return tinlake.getInvestor(address);

          case 3:
            investor = _context11.sent;
            _context11.next = 9;
            break;

          case 6:
            _context11.prev = 6;
            _context11.t0 = _context11["catch"](0);
            return _context11.abrupt("return", loggedError(_context11.t0, 'Investor not found', address));

          case 9:
            return _context11.abrupt("return", {
              data: investor
            });

          case 10:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, null, [[0, 6]]);
  }));
  return _getInvestor.apply(this, arguments);
}

function setAllowance(_x26, _x27, _x28, _x29, _x30) {
  return _setAllowance.apply(this, arguments);
}

function _setAllowance() {
  _setAllowance = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee12(tinlake, address, maxSupplyAmount, maxRedeemAmount, trancheType) {
    var setRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;

            if (!(trancheType === "junior")) {
              _context12.next = 7;
              break;
            }

            _context12.next = 4;
            return tinlake.approveAllowanceJunior(address, maxSupplyAmount, maxRedeemAmount);

          case 4:
            setRes = _context12.sent;
            _context12.next = 11;
            break;

          case 7:
            if (!(trancheType === "senior")) {
              _context12.next = 11;
              break;
            }

            _context12.next = 10;
            return tinlake.approveAllowanceSenior(address, maxSupplyAmount, maxRedeemAmount);

          case 10:
            setRes = _context12.sent;

          case 11:
            _context12.next = 16;
            break;

          case 13:
            _context12.prev = 13;
            _context12.t0 = _context12["catch"](0);
            return _context12.abrupt("return", loggedError(_context12.t0, "Could not set allowance for ".concat(trancheType), address));

          case 16:
            if (!(setRes.status !== SUCCESS_STATUS)) {
              _context12.next = 18;
              break;
            }

            return _context12.abrupt("return", loggedError(null, "Could not set allowance for ".concat(trancheType), address));

          case 18:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, null, [[0, 13]]);
  }));
  return _setAllowance.apply(this, arguments);
}

function setMinJuniorRatio(_x31, _x32) {
  return _setMinJuniorRatio.apply(this, arguments);
}

function _setMinJuniorRatio() {
  _setMinJuniorRatio = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee13(tinlake, ratio) {
    var setRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;
            _context13.next = 3;
            return tinlake.setMinimumJuniorRatio(ratio);

          case 3:
            setRes = _context13.sent;
            _context13.next = 9;
            break;

          case 6:
            _context13.prev = 6;
            _context13.t0 = _context13["catch"](0);
            return _context13.abrupt("return", loggedError(_context13.t0, 'Could not set min TIN ratio', ''));

          case 9:
            if (!(setRes.status !== SUCCESS_STATUS)) {
              _context13.next = 11;
              break;
            }

            return _context13.abrupt("return", loggedError({}, 'Could not set min TIN ratio', ''));

          case 11:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, null, [[0, 6]]);
  }));
  return _setMinJuniorRatio.apply(this, arguments);
}

function supply(_x33, _x34, _x35) {
  return _supply.apply(this, arguments);
}

function _supply() {
  _supply = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee14(tinlake, supplyAmount, trancheType) {
    var approveRes, supplyRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.prev = 0;

            if (!(trancheType === "junior")) {
              _context14.next = 7;
              break;
            }

            _context14.next = 4;
            return tinlake.approveJuniorForCurrency(supplyAmount);

          case 4:
            approveRes = _context14.sent;
            _context14.next = 11;
            break;

          case 7:
            if (!(trancheType === "senior")) {
              _context14.next = 11;
              break;
            }

            _context14.next = 10;
            return tinlake.approveSeniorForCurrency(supplyAmount);

          case 10:
            approveRes = _context14.sent;

          case 11:
            _context14.next = 16;
            break;

          case 13:
            _context14.prev = 13;
            _context14.t0 = _context14["catch"](0);
            return _context14.abrupt("return", loggedError(_context14.t0, "Could not approve currency for ".concat(trancheType, "."), ''));

          case 16:
            if (!(approveRes.status !== SUCCESS_STATUS)) {
              _context14.next = 18;
              break;
            }

            return _context14.abrupt("return", loggedError({}, "Could not approve currency for ".concat(trancheType, "."), ''));

          case 18:
            _context14.prev = 18;

            if (!(trancheType === "junior")) {
              _context14.next = 25;
              break;
            }

            _context14.next = 22;
            return tinlake.supplyJunior(supplyAmount);

          case 22:
            supplyRes = _context14.sent;
            _context14.next = 29;
            break;

          case 25:
            if (!(trancheType === "senior")) {
              _context14.next = 29;
              break;
            }

            _context14.next = 28;
            return tinlake.supplySenior(supplyAmount);

          case 28:
            supplyRes = _context14.sent;

          case 29:
            _context14.next = 34;
            break;

          case 31:
            _context14.prev = 31;
            _context14.t1 = _context14["catch"](18);
            return _context14.abrupt("return", loggedError(_context14.t1, "Could not supply ".concat(trancheType), ''));

          case 34:
            if (!(supplyRes.status !== SUCCESS_STATUS)) {
              _context14.next = 36;
              break;
            }

            return _context14.abrupt("return", loggedError({}, "Could not supply ".concat(trancheType), ''));

          case 36:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, null, [[0, 13], [18, 31]]);
  }));
  return _supply.apply(this, arguments);
}

function redeem(_x36, _x37, _x38) {
  return _redeem.apply(this, arguments);
}

function _redeem() {
  _redeem = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee15(tinlake, redeemAmount, trancheType) {
    var approveRes, redeemRes;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.prev = 0;

            if (!(trancheType === "junior")) {
              _context15.next = 7;
              break;
            }

            _context15.next = 4;
            return tinlake.approveJuniorToken(redeemAmount);

          case 4:
            approveRes = _context15.sent;
            _context15.next = 11;
            break;

          case 7:
            if (!(trancheType === "senior")) {
              _context15.next = 11;
              break;
            }

            _context15.next = 10;
            return tinlake.approveSeniorToken(redeemAmount);

          case 10:
            approveRes = _context15.sent;

          case 11:
            _context15.next = 16;
            break;

          case 13:
            _context15.prev = 13;
            _context15.t0 = _context15["catch"](0);
            return _context15.abrupt("return", loggedError(_context15.t0, "Could not approve ".concat(trancheType, " Token."), ''));

          case 16:
            if (!(approveRes.status !== SUCCESS_STATUS)) {
              _context15.next = 18;
              break;
            }

            return _context15.abrupt("return", loggedError({}, "Could not approve ".concat(trancheType, " Token."), ''));

          case 18:
            _context15.prev = 18;

            if (!(trancheType === "junior")) {
              _context15.next = 25;
              break;
            }

            _context15.next = 22;
            return tinlake.redeemJunior(redeemAmount);

          case 22:
            redeemRes = _context15.sent;
            _context15.next = 29;
            break;

          case 25:
            if (!(trancheType === "senior")) {
              _context15.next = 29;
              break;
            }

            _context15.next = 28;
            return tinlake.redeemSenior(redeemAmount);

          case 28:
            redeemRes = _context15.sent;

          case 29:
            _context15.next = 34;
            break;

          case 31:
            _context15.prev = 31;
            _context15.t1 = _context15["catch"](18);
            return _context15.abrupt("return", loggedError(_context15.t1, "Could not redeem ".concat(trancheType, "."), ''));

          case 34:
            if (!(redeemRes.status !== SUCCESS_STATUS)) {
              _context15.next = 36;
              break;
            }

            return _context15.abrupt("return", loggedError({}, "Could not redeem ".concat(trancheType, "."), ''));

          case 36:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15, null, [[0, 13], [18, 31]]);
  }));
  return _redeem.apply(this, arguments);
}

function loggedError(error, message, id) {
  console.log("".concat(message, " ").concat(id), error);
  return {
    errorMsg: "".concat(error, " - ").concat(message, " ").concat(id),
    id: id
  };
}

/***/ }),

/***/ "./services/tinlake/index.ts":
/*!***********************************!*\
  !*** ./services/tinlake/index.ts ***!
  \***********************************/
/*! exports provided: getTinlake, authTinlake */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTinlake", function() { return getTinlake; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "authTinlake", function() { return authTinlake; });
/* harmony import */ var _babel_runtime_corejs2_core_js_promise__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/core-js/promise */ "./node_modules/@babel/runtime-corejs2/core-js/promise.js");
/* harmony import */ var _babel_runtime_corejs2_core_js_promise__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_core_js_promise__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! tinlake */ "tinlake");
/* harmony import */ var tinlake__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(tinlake__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./config.ts");
/* harmony import */ var ethjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ethjs */ "ethjs");
/* harmony import */ var ethjs__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(ethjs__WEBPACK_IMPORTED_MODULE_5__);






var contractAddresses = _config__WEBPACK_IMPORTED_MODULE_4__["default"].contractAddresses,
    nftDataDefinition = _config__WEBPACK_IMPORTED_MODULE_4__["default"].nftDataDefinition,
    transactionTimeout = _config__WEBPACK_IMPORTED_MODULE_4__["default"].transactionTimeout,
    rpcUrl = _config__WEBPACK_IMPORTED_MODULE_4__["default"].rpcUrl,
    contractConfig = _config__WEBPACK_IMPORTED_MODULE_4__["default"].contractConfig;
var tinlake = null;
var authing = false;
var authed = false;
function getTinlake() {
  return _getTinlake.apply(this, arguments);
}

function _getTinlake() {
  _getTinlake = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function _callee() {
    var chosenProvider, Web3Connect, injectedProvider, accounts, account, httpProvider;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!tinlake) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return", tinlake);

          case 2:
            chosenProvider = sessionStorage && sessionStorage.getItem('chosenProvider');

            if (!(chosenProvider === 'injected')) {
              _context.next = 21;
              break;
            }

            authing = true;
            Web3Connect = __webpack_require__(/*! web3connect */ "web3connect").default;
            _context.next = 8;
            return Web3Connect.ConnectToInjected();

          case 8:
            injectedProvider = _context.sent;
            _context.next = 11;
            return injectedProvider.enable();

          case 11:
            accounts = _context.sent;
            account = accounts[0];
            tinlake = new tinlake__WEBPACK_IMPORTED_MODULE_3___default.a({
              provider: injectedProvider,
              contractAddresses: contractAddresses,
              nftDataOutputs: nftDataDefinition.contractCall.outputs,
              transactionTimeout: transactionTimeout,
              contractConfig: contractConfig
            });
            _context.next = 16;
            return tinlake.setContractAddresses();

          case 16:
            tinlake.setEthConfig({
              from: account,
              gasLimit: "0x".concat(_config__WEBPACK_IMPORTED_MODULE_4__["default"].gasLimit.toString(16))
            });
            authed = true;
            authing = false;
            _context.next = 25;
            break;

          case 21:
            httpProvider = new ethjs__WEBPACK_IMPORTED_MODULE_5___default.a.HttpProvider(rpcUrl);
            tinlake = new tinlake__WEBPACK_IMPORTED_MODULE_3___default.a({
              provider: httpProvider,
              contractAddresses: contractAddresses,
              nftDataOutputs: nftDataDefinition.contractCall.outputs,
              transactionTimeout: transactionTimeout,
              contractConfig: contractConfig
            });
            _context.next = 25;
            return tinlake.setContractAddresses();

          case 25:
            return _context.abrupt("return", tinlake);

          case 26:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getTinlake.apply(this, arguments);
}

function authTinlake() {
  return _authTinlake.apply(this, arguments);
}

function _authTinlake() {
  _authTinlake = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function _callee2() {
    var provider, accounts, account;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (tinlake) {
              _context2.next = 3;
              break;
            }

            _context2.next = 3;
            return getTinlake();

          case 3:
            if (!(authing || authed)) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt("return");

          case 5:
            authing = true;
            _context2.prev = 6;
            _context2.next = 9;
            return web3ConnectToLast();

          case 9:
            provider = _context2.sent;
            _context2.next = 12;
            return provider.enable();

          case 12:
            accounts = _context2.sent;
            account = accounts[0];
            tinlake.setProvider(provider);
            tinlake.setEthConfig({
              from: account
            });
            authed = true;
            authing = false;
            _context2.next = 24;
            break;

          case 20:
            _context2.prev = 20;
            _context2.t0 = _context2["catch"](6);
            console.log("Tinlake Auth failed ".concat(_context2.t0));
            authing = false;

          case 24:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[6, 20]]);
  }));
  return _authTinlake.apply(this, arguments);
}

function web3Connect() {
  return _web3Connect.apply(this, arguments);
}

function _web3Connect() {
  _web3Connect = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function _callee3() {
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", new _babel_runtime_corejs2_core_js_promise__WEBPACK_IMPORTED_MODULE_0___default.a(function (resolve, reject) {
              // require here since we only want it to be loaded in browser, not on server side rendering
              var Web3Connect = __webpack_require__(/*! web3connect */ "web3connect").default;

              var web3Connect = new Web3Connect.Core({
                providerOptions: {}
              }); // subscibe to connect

              web3Connect.on('connect', function (provider) {
                var info = Web3Connect.getProviderInfo(provider);
                sessionStorage.setItem('chosenProvider', info.type === 'injected' ? 'injected' : info.name);
                resolve(provider);
              }); // subscibe to close

              web3Connect.on('close', function () {
                reject('Web3Connect Modal Closed');
              }); // open modal

              web3Connect.toggleModal();
            }));

          case 1:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _web3Connect.apply(this, arguments);
}

function web3ConnectToLast() {
  return _web3ConnectToLast.apply(this, arguments);
}

function _web3ConnectToLast() {
  _web3ConnectToLast = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__["default"])(
  /*#__PURE__*/
  _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function _callee4() {
    var chosenProvider, Web3Connect;
    return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            chosenProvider = sessionStorage.getItem('chosenProvider');

            if (chosenProvider) {
              _context4.next = 3;
              break;
            }

            return _context4.abrupt("return", web3Connect());

          case 3:
            // require here since we only want it to be loaded in browser, not on server side rendering
            Web3Connect = __webpack_require__(/*! web3connect */ "web3connect").default;
            _context4.t0 = chosenProvider;
            _context4.next = _context4.t0 === 'injected' ? 7 : 8;
            break;

          case 7:
            return _context4.abrupt("return", Web3Connect.ConnectToInjected());

          case 8:
            return _context4.abrupt("return", web3Connect());

          case 9:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _web3ConnectToLast.apply(this, arguments);
}

/***/ }),

/***/ "./utils/etherscanLinkGenerator.ts":
/*!*****************************************!*\
  !*** ./utils/etherscanLinkGenerator.ts ***!
  \*****************************************/
/*! exports provided: getAddressLink, getNFTLink, hexToInt */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAddressLink", function() { return getAddressLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getNFTLink", function() { return getNFTLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hexToInt", function() { return hexToInt; });
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bn.js */ "bn.js");
/* harmony import */ var bn_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bn_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./config.ts");


var etherscanUrl = _config__WEBPACK_IMPORTED_MODULE_1__["default"].etherscanUrl;
var getAddressLink = function getAddressLink(address) {
  return "".concat(etherscanUrl, "/address/").concat(address);
};
var getNFTLink = function getNFTLink(tokenId, registyAddress) {
  return "".concat(etherscanUrl, "/token/").concat(registyAddress, "?a=").concat(tokenId);
};
var hexToInt = function hexToInt(hex) {
  return new bn_js__WEBPACK_IMPORTED_MODULE_0___default.a(hex.replace(/^0x/, ''), 16).toString();
};

/***/ }),

/***/ "./utils/formatAddress.ts":
/*!********************************!*\
  !*** ./utils/formatAddress.ts ***!
  \********************************/
/*! exports provided: formatAddress */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "formatAddress", function() { return formatAddress; });
var formatAddress = function formatAddress(long) {
  return long ? "".concat(long.slice(0, 6), "...").concat(long.slice(-4)) : '';
};

/***/ }),

/***/ "./utils/networkNameResolver.ts":
/*!**************************************!*\
  !*** ./utils/networkNameResolver.ts ***!
  \**************************************/
/*! exports provided: networkIdToName, networkUrlToName */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "networkIdToName", function() { return networkIdToName; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "networkUrlToName", function() { return networkUrlToName; });
function networkIdToName(id) {
  switch (id) {
    case '1':
      return 'Mainnet';

    case '2':
      return 'Morden';

    case '3':
      return 'Ropsten';

    case '4':
      return 'Rinkeby';

    case '5':
      return 'Goerli';

    case '42':
      return 'Kovan';

    case '100':
      return 'XDai';

    case '99':
      return 'Local';

    default:
      return 'unknown';
  }
}
function networkUrlToName(url) {
  if (url.indexOf('mainnet') > -1) return 'Mainnet';
  if (url.indexOf('morden') > -1) return 'Morden';
  if (url.indexOf('ropsten') > -1) return 'Ropsten;';
  if (url.indexOf('rinkeby') > -1) return 'Rinkeby';
  if (url.indexOf('goerli') > -1) return 'Goerli';
  if (url.indexOf('kovan') > -1) return 'Kovan';
  if (url.indexOf('xDai') > -1) return 'XDai';
  if (url.indexOf('localhost') > -1) return 'Local';
  return 'unknown';
}

/***/ }),

/***/ 3:
/*!************************************!*\
  !*** multi ./pages/loans/loan.tsx ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/philipstanislaus/Code/centrifuge/tinlake-ui/pages/loans/loan.tsx */"./pages/loans/loan.tsx");


/***/ }),

/***/ "@centrifuge/axis-display-field":
/*!*************************************************!*\
  !*** external "@centrifuge/axis-display-field" ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@centrifuge/axis-display-field");

/***/ }),

/***/ "@centrifuge/axis-nav-bar":
/*!*******************************************!*\
  !*** external "@centrifuge/axis-nav-bar" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@centrifuge/axis-nav-bar");

/***/ }),

/***/ "@centrifuge/axis-spinner":
/*!*******************************************!*\
  !*** external "@centrifuge/axis-spinner" ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@centrifuge/axis-spinner");

/***/ }),

/***/ "apollo-cache-inmemory":
/*!****************************************!*\
  !*** external "apollo-cache-inmemory" ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("apollo-cache-inmemory");

/***/ }),

/***/ "apollo-client":
/*!********************************!*\
  !*** external "apollo-client" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("apollo-client");

/***/ }),

/***/ "apollo-link-http":
/*!***********************************!*\
  !*** external "apollo-link-http" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("apollo-link-http");

/***/ }),

/***/ "bn.js":
/*!************************!*\
  !*** external "bn.js" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("bn.js");

/***/ }),

/***/ "core-js/library/fn/json/stringify":
/*!****************************************************!*\
  !*** external "core-js/library/fn/json/stringify" ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/json/stringify");

/***/ }),

/***/ "core-js/library/fn/object/assign":
/*!***************************************************!*\
  !*** external "core-js/library/fn/object/assign" ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/assign");

/***/ }),

/***/ "core-js/library/fn/object/create":
/*!***************************************************!*\
  !*** external "core-js/library/fn/object/create" ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/create");

/***/ }),

/***/ "core-js/library/fn/object/define-properties":
/*!**************************************************************!*\
  !*** external "core-js/library/fn/object/define-properties" ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/define-properties");

/***/ }),

/***/ "core-js/library/fn/object/define-property":
/*!************************************************************!*\
  !*** external "core-js/library/fn/object/define-property" ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/define-property");

/***/ }),

/***/ "core-js/library/fn/object/freeze":
/*!***************************************************!*\
  !*** external "core-js/library/fn/object/freeze" ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/freeze");

/***/ }),

/***/ "core-js/library/fn/object/get-own-property-descriptor":
/*!************************************************************************!*\
  !*** external "core-js/library/fn/object/get-own-property-descriptor" ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/get-own-property-descriptor");

/***/ }),

/***/ "core-js/library/fn/object/get-own-property-symbols":
/*!*********************************************************************!*\
  !*** external "core-js/library/fn/object/get-own-property-symbols" ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/get-own-property-symbols");

/***/ }),

/***/ "core-js/library/fn/object/get-prototype-of":
/*!*************************************************************!*\
  !*** external "core-js/library/fn/object/get-prototype-of" ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/get-prototype-of");

/***/ }),

/***/ "core-js/library/fn/object/keys":
/*!*************************************************!*\
  !*** external "core-js/library/fn/object/keys" ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/keys");

/***/ }),

/***/ "core-js/library/fn/object/set-prototype-of":
/*!*************************************************************!*\
  !*** external "core-js/library/fn/object/set-prototype-of" ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/object/set-prototype-of");

/***/ }),

/***/ "core-js/library/fn/promise":
/*!*********************************************!*\
  !*** external "core-js/library/fn/promise" ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/promise");

/***/ }),

/***/ "core-js/library/fn/symbol":
/*!********************************************!*\
  !*** external "core-js/library/fn/symbol" ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/symbol");

/***/ }),

/***/ "core-js/library/fn/symbol/iterator":
/*!*****************************************************!*\
  !*** external "core-js/library/fn/symbol/iterator" ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/symbol/iterator");

/***/ }),

/***/ "ethjs":
/*!************************!*\
  !*** external "ethjs" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("ethjs");

/***/ }),

/***/ "graphql-tag":
/*!******************************!*\
  !*** external "graphql-tag" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("graphql-tag");

/***/ }),

/***/ "grommet":
/*!**************************!*\
  !*** external "grommet" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("grommet");

/***/ }),

/***/ "grommet-icons":
/*!********************************!*\
  !*** external "grommet-icons" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("grommet-icons");

/***/ }),

/***/ "next-server/dist/lib/utils":
/*!*********************************************!*\
  !*** external "next-server/dist/lib/utils" ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("next-server/dist/lib/utils");

/***/ }),

/***/ "next/config":
/*!******************************!*\
  !*** external "next/config" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("next/config");

/***/ }),

/***/ "next/router":
/*!******************************!*\
  !*** external "next/router" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("next/router");

/***/ }),

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("node-fetch");

/***/ }),

/***/ "prop-types":
/*!*****************************!*\
  !*** external "prop-types" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("prop-types");

/***/ }),

/***/ "prop-types-exact":
/*!***********************************!*\
  !*** external "prop-types-exact" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("prop-types-exact");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),

/***/ "react-number-format":
/*!**************************************!*\
  !*** external "react-number-format" ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-number-format");

/***/ }),

/***/ "react-redux":
/*!******************************!*\
  !*** external "react-redux" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-redux");

/***/ }),

/***/ "regenerator-runtime":
/*!**************************************!*\
  !*** external "regenerator-runtime" ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("regenerator-runtime");

/***/ }),

/***/ "styled-components":
/*!************************************!*\
  !*** external "styled-components" ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("styled-components");

/***/ }),

/***/ "tinlake":
/*!**************************!*\
  !*** external "tinlake" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("tinlake");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),

/***/ "web3connect":
/*!******************************!*\
  !*** external "web3connect" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("web3connect");

/***/ })

/******/ });
//# sourceMappingURL=loan.js.map