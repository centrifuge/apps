import * as functions from "firebase-functions";
import {businessInfoController} from "./controllers/businessInfo";

exports.businessInfo = functions.https.onRequest(businessInfoController);
