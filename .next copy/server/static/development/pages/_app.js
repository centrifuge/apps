module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = require('../../../ssr-module-cache.js');
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
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

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

/***/ "./components/StyledApp/index.tsx":
/*!****************************************!*\
  !*** ./components/StyledApp/index.tsx ***!
  \****************************************/
/*! exports provided: StyledApp */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StyledApp", function() { return StyledApp; });
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral */ "./node_modules/@babel/runtime-corejs2/helpers/esm/taggedTemplateLiteral.js");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! styled-components */ "styled-components");
/* harmony import */ var styled_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(styled_components__WEBPACK_IMPORTED_MODULE_1__);


function _templateObject() {
  var data = Object(_babel_runtime_corejs2_helpers_esm_taggedTemplateLiteral__WEBPACK_IMPORTED_MODULE_0__["default"])(["\n  /*\n   * Workaround for too light input:disabled text. Should be fixed by using a\n   * dedicated component at some point for displaying readonly values.\n   */\n  input:disabled {\n    opacity: 0.5;\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}


var StyledApp = styled_components__WEBPACK_IMPORTED_MODULE_1___default.a.div(_templateObject());

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

/***/ "./ducks/investments.ts":
/*!******************************!*\
  !*** ./ducks/investments.ts ***!
  \******************************/
/*! exports provided: default, loadInvestor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return reducer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadInvestor", function() { return loadInvestor; });
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/objectSpread */ "./node_modules/@babel/runtime-corejs2/helpers/esm/objectSpread.js");
/* harmony import */ var _services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/tinlake/actions */ "./services/tinlake/actions.ts");



 // Actions

var LOAD_INVESTOR = 'tinlake-ui/investments/LOAD_INVESTOR';
var INVESTOR_NOT_FOUND = 'tinlake-ui/investments/INVESTOR_NOT_FOUND';
var RECEIVE_INVESTOR = 'tinlake-ui/investments/RECEIVE_INVESTOR';
var initialState = {
  investorState: null,
  investor: null
}; // Reducer

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    type: ''
  };

  switch (action.type) {
    case LOAD_INVESTOR:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        investorState: 'loading',
        investor: null
      });

    case INVESTOR_NOT_FOUND:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        investorState: 'not found'
      });

    case RECEIVE_INVESTOR:
      return Object(_babel_runtime_corejs2_helpers_esm_objectSpread__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state, {
        investorState: 'found',
        investor: action.investor
      });

    default:
      return state;
  }
}
function loadInvestor(tinlake, address) {
  var refresh = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return (
    /*#__PURE__*/
    function () {
      var _ref = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(dispatch) {
        var result;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!refresh) {
                  dispatch({
                    type: LOAD_INVESTOR
                  });
                }

                _context.next = 3;
                return Object(_services_tinlake_actions__WEBPACK_IMPORTED_MODULE_3__["getInvestor"])(tinlake, address);

              case 3:
                result = _context.sent;

                if (result.errorMsg) {
                  dispatch({
                    type: INVESTOR_NOT_FOUND
                  });
                }

                dispatch({
                  type: RECEIVE_INVESTOR,
                  investor: result.data
                });

              case 6:
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

/***/ "./node_modules/@babel/runtime-corejs2/core-js/array/is-array.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/array/is-array.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/array/is-array */ "core-js/library/fn/array/is-array");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/core-js/get-iterator.js":
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/core-js/get-iterator.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! core-js/library/fn/get-iterator */ "core-js/library/fn/get-iterator");

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

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/arrayWithHoles.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/arrayWithHoles.js ***!
  \***************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _arrayWithHoles; });
/* harmony import */ var _core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/array/is-array */ "./node_modules/@babel/runtime-corejs2/core-js/array/is-array.js");
/* harmony import */ var _core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0__);

function _arrayWithHoles(arr) {
  if (_core_js_array_is_array__WEBPACK_IMPORTED_MODULE_0___default()(arr)) return arr;
}

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

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/iterableToArrayLimit.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/iterableToArrayLimit.js ***!
  \*********************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _iterableToArrayLimit; });
/* harmony import */ var _core_js_get_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core-js/get-iterator */ "./node_modules/@babel/runtime-corejs2/core-js/get-iterator.js");
/* harmony import */ var _core_js_get_iterator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_get_iterator__WEBPACK_IMPORTED_MODULE_0__);

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = _core_js_get_iterator__WEBPACK_IMPORTED_MODULE_0___default()(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
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

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/nonIterableRest.js":
/*!****************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/nonIterableRest.js ***!
  \****************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _nonIterableRest; });
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
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

/***/ "./node_modules/@babel/runtime-corejs2/helpers/esm/slicedToArray.js":
/*!**************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs2/helpers/esm/slicedToArray.js ***!
  \**************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return _slicedToArray; });
/* harmony import */ var _arrayWithHoles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./arrayWithHoles */ "./node_modules/@babel/runtime-corejs2/helpers/esm/arrayWithHoles.js");
/* harmony import */ var _iterableToArrayLimit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iterableToArrayLimit */ "./node_modules/@babel/runtime-corejs2/helpers/esm/iterableToArrayLimit.js");
/* harmony import */ var _nonIterableRest__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./nonIterableRest */ "./node_modules/@babel/runtime-corejs2/helpers/esm/nonIterableRest.js");



function _slicedToArray(arr, i) {
  return Object(_arrayWithHoles__WEBPACK_IMPORTED_MODULE_0__["default"])(arr) || Object(_iterableToArrayLimit__WEBPACK_IMPORTED_MODULE_1__["default"])(arr, i) || Object(_nonIterableRest__WEBPACK_IMPORTED_MODULE_2__["default"])();
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

/***/ "./node_modules/next/app.js":
/*!**********************************!*\
  !*** ./node_modules/next/app.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./dist/pages/_app */ "./node_modules/next/dist/pages/_app.js")


/***/ }),

/***/ "./node_modules/next/dist/pages/_app.js":
/*!**********************************************!*\
  !*** ./node_modules/next/dist/pages/_app.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime-corejs2/helpers/interopRequireDefault */ "./node_modules/@babel/runtime-corejs2/helpers/interopRequireDefault.js");

var _promise = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/core-js/promise */ "./node_modules/@babel/runtime-corejs2/core-js/promise.js"));

var _assign = _interopRequireDefault(__webpack_require__(/*! @babel/runtime-corejs2/core-js/object/assign */ "./node_modules/@babel/runtime-corejs2/core-js/object/assign.js"));

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

var react_1 = __importStar(__webpack_require__(/*! react */ "react"));

var prop_types_1 = __importDefault(__webpack_require__(/*! prop-types */ "prop-types"));

var utils_1 = __webpack_require__(/*! next-server/dist/lib/utils */ "next-server/dist/lib/utils");

var router_1 = __webpack_require__(/*! next/router */ "next/router");

var App =
/*#__PURE__*/
function (_react_1$Component) {
  (0, _inherits2.default)(App, _react_1$Component);

  function App() {
    (0, _classCallCheck2.default)(this, App);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(App).apply(this, arguments));
  }

  (0, _createClass2.default)(App, [{
    key: "getChildContext",
    value: function getChildContext() {
      return {
        router: router_1.makePublicRouterInstance(this.props.router)
      };
    } // Kept here for backwards compatibility.
    // When someone ended App they could call `super.componentDidCatch`. This is now deprecated.

  }, {
    key: "componentDidCatch",
    value: function componentDidCatch(err) {
      throw err;
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
          router = _this$props.router,
          Component = _this$props.Component,
          pageProps = _this$props.pageProps;
      var url = createUrl(router);
      return react_1.default.createElement(Container, null, react_1.default.createElement(Component, (0, _assign.default)({}, pageProps, {
        url: url
      })));
    }
  }], [{
    key: "getInitialProps",
    value: function (_ref) {
      var Component = _ref.Component,
          router = _ref.router,
          ctx = _ref.ctx;

      try {
        return _promise.default.resolve(utils_1.loadGetInitialProps(Component, ctx)).then(function (pageProps) {
          return {
            pageProps: pageProps
          };
        });
      } catch (e) {
        return _promise.default.reject(e);
      }
    }
  }]);
  return App;
}(react_1.Component);

App.childContextTypes = {
  router: prop_types_1.default.object
};
exports.default = App;

var Container =
/*#__PURE__*/
function (_react_1$Component2) {
  (0, _inherits2.default)(Container, _react_1$Component2);

  function Container() {
    (0, _classCallCheck2.default)(this, Container);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Container).apply(this, arguments));
  }

  (0, _createClass2.default)(Container, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.scrollToHash();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this.scrollToHash();
    }
  }, {
    key: "scrollToHash",
    value: function scrollToHash() {
      var hash = window.location.hash;
      hash = hash ? hash.substring(1) : false;
      if (!hash) return;
      var el = document.getElementById(hash);
      if (!el) return; // If we call scrollIntoView() in here without a setTimeout
      // it won't scroll properly.

      setTimeout(function () {
        return el.scrollIntoView();
      }, 0);
    }
  }, {
    key: "render",
    value: function render() {
      return this.props.children;
    }
  }]);
  return Container;
}(react_1.Component);

exports.Container = Container;
var warnUrl = utils_1.execOnce(function () {
  if (true) {
    console.error("Warning: the 'url' property is deprecated. https://err.sh/zeit/next.js/url-deprecated");
  }
});

function createUrl(router) {
  // This is to make sure we don't references the router object at call time
  var pathname = router.pathname,
      asPath = router.asPath,
      query = router.query;
  return {
    get query() {
      warnUrl();
      return query;
    },

    get pathname() {
      warnUrl();
      return pathname;
    },

    get asPath() {
      warnUrl();
      return asPath;
    },

    back: function back() {
      warnUrl();
      router.back();
    },
    push: function push(url, as) {
      warnUrl();
      return router.push(url, as);
    },
    pushTo: function pushTo(href, as) {
      warnUrl();
      var pushRoute = as ? href : null;
      var pushUrl = as || href;
      return router.push(pushRoute, pushUrl);
    },
    replace: function replace(url, as) {
      warnUrl();
      return router.replace(url, as);
    },
    replaceTo: function replaceTo(href, as) {
      warnUrl();
      var replaceRoute = as ? href : null;
      var replaceUrl = as || href;
      return router.replace(replaceRoute, replaceUrl);
    }
  };
}

exports.createUrl = createUrl;

/***/ }),

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs2/regenerator */ "./node_modules/@babel/runtime-corejs2/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs2/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/extends */ "./node_modules/@babel/runtime-corejs2/helpers/esm/extends.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/slicedToArray */ "./node_modules/@babel/runtime-corejs2/helpers/esm/slicedToArray.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs2/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs2/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/possibleConstructorReturn */ "./node_modules/@babel/runtime-corejs2/helpers/esm/possibleConstructorReturn.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/getPrototypeOf */ "./node_modules/@babel/runtime-corejs2/helpers/esm/getPrototypeOf.js");
/* harmony import */ var _babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @babel/runtime-corejs2/helpers/esm/inherits */ "./node_modules/@babel/runtime-corejs2/helpers/esm/inherits.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react-redux */ "react-redux");
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var next_app__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! next/app */ "./node_modules/next/app.js");
/* harmony import */ var next_app__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(next_app__WEBPACK_IMPORTED_MODULE_11__);
/* harmony import */ var next_redux_wrapper__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! next-redux-wrapper */ "next-redux-wrapper");
/* harmony import */ var next_redux_wrapper__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(next_redux_wrapper__WEBPACK_IMPORTED_MODULE_12__);
/* harmony import */ var _utils_makeStore__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../utils/makeStore */ "./utils/makeStore.ts");
/* harmony import */ var _centrifuge_axis_theme__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @centrifuge/axis-theme */ "@centrifuge/axis-theme");
/* harmony import */ var _centrifuge_axis_theme__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(_centrifuge_axis_theme__WEBPACK_IMPORTED_MODULE_14__);
/* harmony import */ var _components_Auth__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../components/Auth */ "./components/Auth/index.tsx");
/* harmony import */ var _components_WithTinlake__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../components/WithTinlake */ "./components/WithTinlake/index.tsx");
/* harmony import */ var _components_StyledApp__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../components/StyledApp */ "./components/StyledApp/index.tsx");









var _jsxFileName = "/Users/philipstanislaus/Code/centrifuge/tinlake-ui/pages/_app.tsx";










var MyApp =
/*#__PURE__*/
function (_App) {
  Object(_babel_runtime_corejs2_helpers_esm_inherits__WEBPACK_IMPORTED_MODULE_8__["default"])(MyApp, _App);

  function MyApp() {
    Object(_babel_runtime_corejs2_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_4__["default"])(this, MyApp);

    return Object(_babel_runtime_corejs2_helpers_esm_possibleConstructorReturn__WEBPACK_IMPORTED_MODULE_6__["default"])(this, Object(_babel_runtime_corejs2_helpers_esm_getPrototypeOf__WEBPACK_IMPORTED_MODULE_7__["default"])(MyApp).apply(this, arguments));
  }

  Object(_babel_runtime_corejs2_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_5__["default"])(MyApp, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          Component = _this$props.Component,
          pageProps = _this$props.pageProps,
          store = _this$props.store,
          router = _this$props.router,
          asPath = _this$props.router.asPath; // Next.js currently does not allow trailing slash in a route, but Netlify appends trailing slashes. This is a
      // client side redirect in case trailing slash occurs. See https://github.com/zeit/next.js/issues/5214 for details

      if (asPath && asPath.length > 1) {
        var _asPath$split = asPath.split('?'),
            _asPath$split2 = Object(_babel_runtime_corejs2_helpers_esm_slicedToArray__WEBPACK_IMPORTED_MODULE_3__["default"])(_asPath$split, 2),
            path = _asPath$split2[0],
            _asPath$split2$ = _asPath$split2[1],
            query = _asPath$split2$ === void 0 ? '' : _asPath$split2$;

        if (path.endsWith('/')) {
          var asPathWithoutTrailingSlash = path.replace(/\/*$/gim, '') + (query ? "?".concat(query) : '');

          if (typeof window !== 'undefined') {
            router.replace(asPathWithoutTrailingSlash, undefined, {
              shallow: true
            });
            return null;
          }
        }
      }

      return react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_centrifuge_axis_theme__WEBPACK_IMPORTED_MODULE_14__["AxisTheme"], {
        full: true,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 35
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_components_StyledApp__WEBPACK_IMPORTED_MODULE_17__["StyledApp"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 36
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(next_app__WEBPACK_IMPORTED_MODULE_11__["Container"], {
        __source: {
          fileName: _jsxFileName,
          lineNumber: 37
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(react_redux__WEBPACK_IMPORTED_MODULE_10__["Provider"], {
        store: store,
        __source: {
          fileName: _jsxFileName,
          lineNumber: 38
        },
        __self: this
      }, react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_components_WithTinlake__WEBPACK_IMPORTED_MODULE_16__["default"], {
        render: function render(tinlake) {
          return react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(_components_Auth__WEBPACK_IMPORTED_MODULE_15__["default"], {
            tinlake: tinlake,
            render: function render() {
              return react__WEBPACK_IMPORTED_MODULE_9___default.a.createElement(Component, Object(_babel_runtime_corejs2_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_2__["default"])({}, pageProps, {
                __source: {
                  fileName: _jsxFileName,
                  lineNumber: 41
                },
                __self: this
              }));
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
      })))));
    }
  }], [{
    key: "getInitialProps",
    value: function () {
      var _getInitialProps = Object(_babel_runtime_corejs2_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__["default"])(
      /*#__PURE__*/
      _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee(_ref) {
        var Component, ctx, pageProps;
        return _babel_runtime_corejs2_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                Component = _ref.Component, ctx = _ref.ctx;

                if (!Component.getInitialProps) {
                  _context.next = 7;
                  break;
                }

                _context.next = 4;
                return Component.getInitialProps(ctx);

              case 4:
                _context.t0 = _context.sent;
                _context.next = 8;
                break;

              case 7:
                _context.t0 = {};

              case 8:
                pageProps = _context.t0;
                return _context.abrupt("return", {
                  pageProps: pageProps
                });

              case 10:
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

  return MyApp;
}(next_app__WEBPACK_IMPORTED_MODULE_11___default.a);

/* harmony default export */ __webpack_exports__["default"] = (next_redux_wrapper__WEBPACK_IMPORTED_MODULE_12___default()(_utils_makeStore__WEBPACK_IMPORTED_MODULE_13__["default"])(MyApp));

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

/***/ "./utils/makeStore.ts":
/*!****************************!*\
  !*** ./utils/makeStore.ts ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var redux__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! redux */ "redux");
/* harmony import */ var redux__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(redux__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ducks_loans__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../ducks/loans */ "./ducks/loans.ts");
/* harmony import */ var _ducks_investments__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ducks/investments */ "./ducks/investments.ts");
/* harmony import */ var _ducks_analytics__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../ducks/analytics */ "./ducks/analytics.ts");
/* harmony import */ var _ducks_auth__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../ducks/auth */ "./ducks/auth.ts");
/* harmony import */ var _ducks_transactions__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../ducks/transactions */ "./ducks/transactions.ts");
/* harmony import */ var redux_thunk__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! redux-thunk */ "redux-thunk");
/* harmony import */ var redux_thunk__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(redux_thunk__WEBPACK_IMPORTED_MODULE_6__);







var composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : redux__WEBPACK_IMPORTED_MODULE_0__["compose"];

var makeStore = function makeStore(initialState) {
  return Object(redux__WEBPACK_IMPORTED_MODULE_0__["createStore"])(Object(redux__WEBPACK_IMPORTED_MODULE_0__["combineReducers"])({
    loans: _ducks_loans__WEBPACK_IMPORTED_MODULE_1__["default"],
    investments: _ducks_investments__WEBPACK_IMPORTED_MODULE_2__["default"],
    analytics: _ducks_analytics__WEBPACK_IMPORTED_MODULE_3__["default"],
    auth: _ducks_auth__WEBPACK_IMPORTED_MODULE_4__["default"],
    transactions: _ducks_transactions__WEBPACK_IMPORTED_MODULE_5__["default"]
  }), initialState, composeEnhancers(Object(redux__WEBPACK_IMPORTED_MODULE_0__["applyMiddleware"])(redux_thunk__WEBPACK_IMPORTED_MODULE_6___default.a)));
};

/* harmony default export */ __webpack_exports__["default"] = (makeStore);

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

/***/ 0:
/*!*****************************************!*\
  !*** multi private-next-pages/_app.tsx ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! private-next-pages/_app.tsx */"./pages/_app.tsx");


/***/ }),

/***/ "@centrifuge/axis-theme":
/*!*****************************************!*\
  !*** external "@centrifuge/axis-theme" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@centrifuge/axis-theme");

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

/***/ "core-js/library/fn/array/is-array":
/*!****************************************************!*\
  !*** external "core-js/library/fn/array/is-array" ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/array/is-array");

/***/ }),

/***/ "core-js/library/fn/get-iterator":
/*!**************************************************!*\
  !*** external "core-js/library/fn/get-iterator" ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("core-js/library/fn/get-iterator");

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

/***/ "next-redux-wrapper":
/*!*************************************!*\
  !*** external "next-redux-wrapper" ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("next-redux-wrapper");

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

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),

/***/ "react-redux":
/*!******************************!*\
  !*** external "react-redux" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-redux");

/***/ }),

/***/ "redux":
/*!************************!*\
  !*** external "redux" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("redux");

/***/ }),

/***/ "redux-thunk":
/*!******************************!*\
  !*** external "redux-thunk" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("redux-thunk");

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

/***/ "web3connect":
/*!******************************!*\
  !*** external "web3connect" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("web3connect");

/***/ })

/******/ });
//# sourceMappingURL=_app.js.map