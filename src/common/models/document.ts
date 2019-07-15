import {
  CoreapiCreateDocumentRequest,
  CoreapiDocumentResponse,
} from "../../../clients/centrifuge-node";

export interface Document extends CoreapiCreateDocumentRequest {
  _id?: string;
}

export interface DocResponse extends CoreapiDocumentResponse {
  ownerId?: string;
  _id?: string;
  createdAt?: Date,
  updatedAt?: Date
}