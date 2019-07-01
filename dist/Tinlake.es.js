import Eth from 'ethjs';
import Abi from 'web3-eth-abi';
import utils from 'web3-utils';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var APPRAISER = "0x791e9c006ad2cfbc19ab4dba1493a7b4fd878ffb";
var TITLE = "0xcfd31ae903e3f24bdd05d5b8c0647a379027ac3d";
var LIGHTSWITCH = "0x93dbc477a429b9c79f04de31f078414b41d9c296";
var PILE = "0xf06c77d26bf7c421d0a51ed224337a2eb248146f";
var SHELF = "0x2511817b6a7c85ae955536888668a6e71061a9f8";
var COLLATERAL = "0xf89f248b1dc5868b4a4a18903b85d824e49f097b";
var DESK = "0xc90cc64c9748cee655fcfc83a37637e52bae96e7";
var RECEPTION = "0x7ddb8c63b9b9b58023459e2edd451576fada3d8c";
var LENDER = "0x1ee12a18d06b29e024d4b38690ccc8c3ee770945";
var CVTJOIN = "0xd50b45a23950c2f2a93684ccc799214cbcfec0c4";
var CVTPIP = "0xa608167b835d70649ede64b21ec0beaa070e5012";
var NFT_COLLATERAL = "0x811e4db6112e52f45f979b075ed8749477e401b3";
var DEPLOYER = "0x46ec091397425a60bad68c15591951751773a28b";
var ADMIT = "0x1add1ccc313de5dbaf12254d93e2a3e4ef02d080";
var SPELL = "0x70c46a468f48b79c9a4c8c31711aab4b08ff13e5";
var CURRENCY = "0xc101b98ad804caa3052b37cb14a76d7ced0be232";
var defaultContractAddresses = {
  APPRAISER: APPRAISER,
  TITLE: TITLE,
  LIGHTSWITCH: LIGHTSWITCH,
  PILE: PILE,
  SHELF: SHELF,
  COLLATERAL: COLLATERAL,
  DESK: DESK,
  RECEPTION: RECEPTION,
  LENDER: LENDER,
  CVTJOIN: CVTJOIN,
  CVTPIP: CVTPIP,
  NFT_COLLATERAL: NFT_COLLATERAL,
  DEPLOYER: DEPLOYER,
  ADMIT: ADMIT,
  SPELL: SPELL,
  CURRENCY: CURRENCY
};

var contractAbiNft = [
  {
    constant: true,
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4"
      }
    ],
    name: "supportsInterface",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "getApproved",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "mint",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "safeTransferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "ownerOf",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "approved",
        type: "bool"
      }
    ],
    name: "setApprovalForAll",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      },
      {
        name: "_data",
        type: "bytes"
      }
    ],
    name: "safeTransferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      },
      {
        name: "operator",
        type: "address"
      }
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        name: "to",
        type: "address"
      },
      {
        indexed: true,
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "approved",
        type: "address"
      },
      {
        indexed: true,
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "operator",
        type: "address"
      },
      {
        indexed: false,
        name: "approved",
        type: "bool"
      }
    ],
    name: "ApprovalForAll",
    type: "event"
  }
];

var contractAbiTitle = [
  {
    constant: true,
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4"
      }
    ],
    name: "supportsInterface",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "count",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "getApproved",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "safeTransferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "ownerOf",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "issue",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "to",
        type: "address"
      },
      {
        name: "approved",
        type: "bool"
      }
    ],
    name: "setApprovalForAll",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "from",
        type: "address"
      },
      {
        name: "to",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      },
      {
        name: "_data",
        type: "bytes"
      }
    ],
    name: "safeTransferFrom",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "tokenURI",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address"
      },
      {
        name: "operator",
        type: "address"
      }
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "uri",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "name",
        type: "string"
      },
      {
        name: "symbol",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        name: "to",
        type: "address"
      },
      {
        indexed: true,
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "approved",
        type: "address"
      },
      {
        indexed: true,
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        name: "operator",
        type: "address"
      },
      {
        indexed: false,
        name: "approved",
        type: "bool"
      }
    ],
    name: "ApprovalForAll",
    type: "event"
  }
];

var contractAbiCurrency = [
  {
    constant: true,
    inputs: [
    ],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "src",
        type: "address"
      },
      {
        name: "dst",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "PERMIT_TYPEHASH",
    outputs: [
      {
        name: "",
        type: "bytes32"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        name: "",
        type: "bytes32"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "mint",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "version",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "nonces",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "burn",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "dst",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "push",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "src",
        type: "address"
      },
      {
        name: "dst",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "move",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      },
      {
        name: "",
        type: "address"
      }
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "pull",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        name: "symbol_",
        type: "string"
      },
      {
        name: "name_",
        type: "string"
      },
      {
        name: "version_",
        type: "string"
      },
      {
        name: "chainId_",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "src",
        type: "address"
      },
      {
        indexed: true,
        name: "usr",
        type: "address"
      },
      {
        indexed: false,
        name: "wad",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "src",
        type: "address"
      },
      {
        indexed: true,
        name: "dst",
        type: "address"
      },
      {
        indexed: false,
        name: "wad",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  }
];

var contractAbiAdmit = [
  {
    constant: false,
    inputs: [
      {
        name: "registry",
        type: "address"
      },
      {
        name: "nft",
        type: "uint256"
      },
      {
        name: "principal",
        type: "uint256"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "admit",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "title_",
        type: "address"
      },
      {
        name: "shelf_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "loan",
        type: "uint256"
      }
    ],
    name: "Created",
    type: "event"
  }
];

var contractAbiReception = [
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "deposit",
        type: "address"
      }
    ],
    name: "borrow",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "wad",
        type: "uint256"
      },
      {
        name: "usrT",
        type: "address"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "repay",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "desk_",
        type: "address"
      },
      {
        name: "title_",
        type: "address"
      },
      {
        name: "shelf_",
        type: "address"
      },
      {
        name: "pile_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
];

var contractAbiDesk = [
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "valve",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "lightswitch",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "pile",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "reduce",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
    ],
    name: "balance",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "lender",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "what",
        type: "bytes32"
      },
      {
        name: "data",
        type: "address"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "collateral",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "pile_",
        type: "address"
      },
      {
        name: "valve_",
        type: "address"
      },
      {
        name: "collateral_",
        type: "address"
      },
      {
        name: "lightswitch_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
];

var contractAbiShelf = [
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    name: "shelf",
    outputs: [
      {
        name: "registry",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      },
      {
        name: "price",
        type: "uint256"
      },
      {
        name: "principal",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "appraiser",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "registry_",
        type: "address"
      },
      {
        name: "nft_",
        type: "uint256"
      },
      {
        name: "principal_",
        type: "uint256"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "pile",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deposit",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "release",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      }
    ],
    name: "adjust",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "registry_",
        type: "address"
      },
      {
        name: "nft_",
        type: "uint256"
      },
      {
        name: "to",
        type: "address"
      }
    ],
    name: "move",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "registry_",
        type: "address"
      },
      {
        name: "nft_",
        type: "uint256"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "bags",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "pile_",
        type: "address"
      },
      {
        name: "appraiser_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
];

var contractAbiAppraiser = [
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    name: "value",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "registry",
        type: "address"
      },
      {
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "appraise",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
];

var contractAbiLender = [
  {
    constant: true,
    inputs: [
    ],
    name: "gemJoin",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "tkn",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usrC",
        type: "address"
      },
      {
        name: "usrT",
        type: "address"
      },
      {
        name: "wadC",
        type: "uint256"
      },
      {
        name: "wadT",
        type: "uint256"
      }
    ],
    name: "release",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
    ],
    name: "poke",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "vat",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "lightswitch",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "manager",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usrC",
        type: "address"
      },
      {
        name: "usrT",
        type: "address"
      },
      {
        name: "wadC",
        type: "uint256"
      },
      {
        name: "wadT",
        type: "uint256"
      }
    ],
    name: "wipe",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usrC",
        type: "address"
      },
      {
        name: "usrT",
        type: "address"
      },
      {
        name: "wadC",
        type: "uint256"
      },
      {
        name: "wadT",
        type: "uint256"
      }
    ],
    name: "lock",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "free",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "pile",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "gem",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "cdp",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "freeGem",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usrC",
        type: "address"
      },
      {
        name: "usrT",
        type: "address"
      },
      {
        name: "wadC",
        type: "uint256"
      },
      {
        name: "wadT",
        type: "uint256"
      }
    ],
    name: "provide",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "daiJoin",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "ilk",
    outputs: [
      {
        name: "",
        type: "bytes32"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "what",
        type: "bytes32"
      },
      {
        name: "data",
        type: "address"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "collateral",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "what",
        type: "bytes32"
      },
      {
        name: "data",
        type: "bytes32"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "proxy",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
    ],
    name: "open",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        name: "tkn_",
        type: "address"
      },
      {
        name: "collateral_",
        type: "address"
      },
      {
        name: "proxy_",
        type: "address"
      },
      {
        name: "manager_",
        type: "address"
      },
      {
        name: "daiJoin_",
        type: "address"
      },
      {
        name: "vat_",
        type: "address"
      },
      {
        name: "lightswitch_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: true,
    inputs: [
      {
        indexed: true,
        name: "sig",
        type: "bytes4"
      },
      {
        indexed: true,
        name: "guy",
        type: "address"
      },
      {
        indexed: true,
        name: "foo",
        type: "bytes32"
      },
      {
        indexed: true,
        name: "bar",
        type: "bytes32"
      },
      {
        indexed: false,
        name: "wad",
        type: "uint256"
      },
      {
        indexed: false,
        name: "fax",
        type: "bytes"
      }
    ],
    name: "LogNote",
    type: "event"
  }
];

var contractAbiPile = [
  {
    constant: true,
    inputs: [
    ],
    name: "tkn",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "wad",
        type: "uint256"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "withdraw",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "wad",
        type: "uint256"
      }
    ],
    name: "borrow",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "Balance",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "fee_",
        type: "uint256"
      },
      {
        name: "balance_",
        type: "uint256"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "want",
    outputs: [
      {
        name: "",
        type: "int256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    name: "fees",
    outputs: [
      {
        name: "debt",
        type: "uint256"
      },
      {
        name: "chi",
        type: "uint256"
      },
      {
        name: "speed",
        type: "uint256"
      },
      {
        name: "rho",
        type: "uint48"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "fee",
        type: "uint256"
      }
    ],
    name: "drip",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "Debt",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "rely",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "fee",
        type: "uint256"
      },
      {
        name: "speed_",
        type: "uint256"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "deny",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      },
      {
        name: "wad",
        type: "uint256"
      },
      {
        name: "usr",
        type: "address"
      }
    ],
    name: "repay",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
    ],
    name: "lender",
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      }
    ],
    name: "debtOf",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    name: "wards",
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "loan",
        type: "uint256"
      }
    ],
    name: "collect",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      {
        name: "what",
        type: "bytes32"
      },
      {
        name: "data",
        type: "address"
      }
    ],
    name: "file",
    outputs: [
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    name: "loans",
    outputs: [
      {
        name: "debt",
        type: "uint256"
      },
      {
        name: "balance",
        type: "uint256"
      },
      {
        name: "fee",
        type: "uint256"
      },
      {
        name: "chi",
        type: "uint256"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        name: "tkn_",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: true,
    inputs: [
      {
        indexed: true,
        name: "sig",
        type: "bytes4"
      },
      {
        indexed: true,
        name: "guy",
        type: "address"
      },
      {
        indexed: true,
        name: "foo",
        type: "bytes32"
      },
      {
        indexed: true,
        name: "bar",
        type: "bytes32"
      },
      {
        indexed: false,
        name: "wad",
        type: "uint256"
      },
      {
        indexed: false,
        name: "fax",
        type: "bytes"
      }
    ],
    name: "LogNote",
    type: "event"
  }
];

var abiCoder = new Abi.AbiCoder();
var Tinlake = /** @class */ (function () {
    function Tinlake(provider, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, contractAbis = _b.contractAbis, contractAddresses = _b.contractAddresses, ethOptions = _b.ethOptions, ethConfig = _b.ethConfig;
        this.loanCount = function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.title.count()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res[0]];
                }
            });
        }); };
        this.getLoan = function (loanId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.shelf.shelf(loanId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.getBalanceDebt = function (loanId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.pile.loans(loanId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.approveNFT = function (tokenID, to) {
            return _this.contracts.nft.approve(to, tokenID, _this.ethConfig).then(function (txHash) {
                console.log("[NFT Approve] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.ownerOfNFT = function (tokenID) {
            return _this.contracts.nft.ownerOf(tokenID);
        };
        this.balanceOfCurrency = function (usr) {
            return _this.contracts.currency.balanceOf(usr);
        };
        this.mintNFT = function (deposit, tokenID) {
            return _this.contracts.nft.mint(deposit, tokenID, _this.ethConfig).then(function (txHash) {
                console.log("[NFT.mint] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.adminAdmit = function (registry, nft, principal, usr) {
            return _this.contracts.admit.admit(registry, nft, principal, usr, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Admit.admit] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.adminAppraise = function (loanID, appraisal) {
            return _this.contracts.appraiser.file(loanID, appraisal, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Appraisal.file] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.borrow = function (loanID, to) {
            return _this.contracts.reception.borrow(loanID, to, _this.ethConfig).then(function (txHash) {
                console.log("[Reception.borrow] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['reception'].abi);
            });
        };
        this.repay = function (loan, wad, usrT, usr) {
            return _this.contracts.reception.repay(loan, wad, usrT, usr, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Reception.repay] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['reception'].abi);
            });
        };
        this.approveCurrency = function (usr, wad) {
            return _this.contracts.currency.approve(usr, wad, _this.ethConfig).then(function (txHash) {
                console.log("[Currency.approve] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['currency'].abi);
            });
        };
        this.lenderRely = function (usr) {
            return _this.contracts.lender.rely(usr, _this.ethConfig).then(function (txHash) {
                console.log("[Lender.rely] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['lender'].abi);
            });
        };
        this.contractAbis = contractAbis || {
            nft: contractAbiNft,
            title: contractAbiTitle,
            currency: contractAbiCurrency,
            admit: contractAbiAdmit,
            reception: contractAbiReception,
            desk: contractAbiDesk,
            shelf: contractAbiShelf,
            appraiser: contractAbiAppraiser,
            lender: contractAbiLender,
            pile: contractAbiPile,
        };
        this.contractAddresses = contractAddresses || defaultContractAddresses;
        this.provider = provider;
        this.ethOptions = ethOptions || {};
        this.ethConfig = ethConfig || {};
        this.eth = new Eth(this.provider, this.ethOptions);
        this.contracts = {
            nft: this.eth.contract(this.contractAbis.nft)
                .at(this.contractAddresses['NFT_COLLATERAL']),
            title: this.eth.contract(this.contractAbis.title)
                .at(this.contractAddresses['TITLE']),
            currency: this.eth.contract(this.contractAbis.currency)
                .at(this.contractAddresses['CURRENCY']),
            admit: this.eth.contract(this.contractAbis.admit)
                .at(this.contractAddresses['ADMIT']),
            reception: this.eth.contract(this.contractAbis.reception)
                .at(this.contractAddresses['RECEPTION']),
            desk: this.eth.contract(this.contractAbis.desk)
                .at(this.contractAddresses['DESK']),
            shelf: this.eth.contract(this.contractAbis.shelf)
                .at(this.contractAddresses['SHELF']),
            appraiser: this.eth.contract(this.contractAbis.appraiser)
                .at(this.contractAddresses['APPRAISER']),
            lender: this.eth.contract(this.contractAbis.lender)
                .at(this.contractAddresses['LENDER']),
            pile: this.eth.contract(this.contractAbis.pile)
                .at(this.contractAddresses['PILE']),
        };
    }
    return Tinlake;
}());
var waitAndReturnEvents = function (eth, txHash, abi) {
    return new Promise(function (resolve, reject) {
        waitForTransaction(eth, txHash).then(function (tx) {
            eth.getTransactionReceipt(tx.hash, function (err, receipt) {
                if (err != null) {
                    reject('failed to get receipt');
                }
                var events = getEvents(receipt, abi);
                resolve({ events: events, txHash: tx.hash, status: receipt.status });
            });
        });
    });
};
// todo replace with a better polling
var waitForTransaction = function (eth, txHash) {
    return new Promise(function (resolve, reject) {
        var secMax = 5;
        var sec = 0;
        var wait = function (txHash) {
            setTimeout(function () {
                eth.getTransactionByHash(txHash, function (err, tx) {
                    if (tx.blockHash != null) {
                        resolve(tx);
                        return;
                    }
                    console.log("waiting for tx :" + txHash);
                    sec = sec + 1;
                    if (sec !== secMax) {
                        wait(txHash);
                    }
                });
            }, 1000);
        };
        wait(txHash);
    });
};
var findEvent = function (abi, funcSignature) {
    return abi.filter(function (item) {
        if (item.type !== 'event')
            return false;
        var signature = item.name + "(" + item.inputs.map(function (input) { return input.type; }).join(',') + ")";
        var hash = utils.sha3(signature);
        if (hash === funcSignature)
            return true;
    });
};
var getEvents = function (receipt, abi) {
    if (receipt.logs.length === 0) {
        return null;
    }
    var events = [];
    receipt.logs.forEach(function (log) {
        var funcSignature = log.topics[0];
        var matches = findEvent(abi, funcSignature);
        if (matches.length === 1) {
            var event = matches[0];
            var inputs = event.inputs.filter(function (input) { return input.indexed; })
                .map(function (input) { return input.type; });
            // remove 0x prefix from topics
            var topics = log.topics.map(function (t) {
                return t.replace('0x', '');
            });
            // concat topics without first topic (func signature)
            var bytes = "0x" + topics.slice(1).join('');
            var data = abiCoder.decodeParameters(inputs, bytes);
            events.push({ event: event, data: data });
        }
    });
    return events;
};

export default Tinlake;
