/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query GetDocuments($pagination: PaginationInput) {\n  documents(pagination: $pagination) {\n    items {\n      _id\n      filename\n      fileUrl\n      pages\n      chunksCount\n      status\n      createdAt\n      updatedAt\n    }\n    totalCount\n    page\n    totalPages\n  }\n}\n\nmutation UploadDocument($file: Upload!) {\n  uploadDocument(file: $file)\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}\n\nmutation ReprocessDocument($id: ID!) {\n  reprocessDocument(id: $id)\n}\n\nsubscription DocumentStatusUpdated {\n  documentStatusUpdated {\n    _id\n    filename\n    fileUrl\n    pages\n    chunksCount\n    status\n    createdAt\n    updatedAt\n  }\n}": typeof types.GetDocumentsDocument,
    "mutation UserLogin($input: UserLoginInput!) {\n  userLogin(input: $input)\n}": typeof types.UserLoginDocument,
    "mutation UserLogout {\n  userLogout\n}": typeof types.UserLogoutDocument,
    "mutation UserSignUp($input: UserSignupInput!) {\n  userSignUp(input: $input)\n}": typeof types.UserSignUpDocument,
    "query GetUserProfile {\n  getUserProfile {\n    _id\n    createdAt\n    email\n    name\n    updatedAt\n  }\n}": typeof types.GetUserProfileDocument,
};
const documents: Documents = {
    "query GetDocuments($pagination: PaginationInput) {\n  documents(pagination: $pagination) {\n    items {\n      _id\n      filename\n      fileUrl\n      pages\n      chunksCount\n      status\n      createdAt\n      updatedAt\n    }\n    totalCount\n    page\n    totalPages\n  }\n}\n\nmutation UploadDocument($file: Upload!) {\n  uploadDocument(file: $file)\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}\n\nmutation ReprocessDocument($id: ID!) {\n  reprocessDocument(id: $id)\n}\n\nsubscription DocumentStatusUpdated {\n  documentStatusUpdated {\n    _id\n    filename\n    fileUrl\n    pages\n    chunksCount\n    status\n    createdAt\n    updatedAt\n  }\n}": types.GetDocumentsDocument,
    "mutation UserLogin($input: UserLoginInput!) {\n  userLogin(input: $input)\n}": types.UserLoginDocument,
    "mutation UserLogout {\n  userLogout\n}": types.UserLogoutDocument,
    "mutation UserSignUp($input: UserSignupInput!) {\n  userSignUp(input: $input)\n}": types.UserSignUpDocument,
    "query GetUserProfile {\n  getUserProfile {\n    _id\n    createdAt\n    email\n    name\n    updatedAt\n  }\n}": types.GetUserProfileDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetDocuments($pagination: PaginationInput) {\n  documents(pagination: $pagination) {\n    items {\n      _id\n      filename\n      fileUrl\n      pages\n      chunksCount\n      status\n      createdAt\n      updatedAt\n    }\n    totalCount\n    page\n    totalPages\n  }\n}\n\nmutation UploadDocument($file: Upload!) {\n  uploadDocument(file: $file)\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}\n\nmutation ReprocessDocument($id: ID!) {\n  reprocessDocument(id: $id)\n}\n\nsubscription DocumentStatusUpdated {\n  documentStatusUpdated {\n    _id\n    filename\n    fileUrl\n    pages\n    chunksCount\n    status\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query GetDocuments($pagination: PaginationInput) {\n  documents(pagination: $pagination) {\n    items {\n      _id\n      filename\n      fileUrl\n      pages\n      chunksCount\n      status\n      createdAt\n      updatedAt\n    }\n    totalCount\n    page\n    totalPages\n  }\n}\n\nmutation UploadDocument($file: Upload!) {\n  uploadDocument(file: $file)\n}\n\nmutation DeleteDocument($id: ID!) {\n  deleteDocument(id: $id)\n}\n\nmutation ReprocessDocument($id: ID!) {\n  reprocessDocument(id: $id)\n}\n\nsubscription DocumentStatusUpdated {\n  documentStatusUpdated {\n    _id\n    filename\n    fileUrl\n    pages\n    chunksCount\n    status\n    createdAt\n    updatedAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UserLogin($input: UserLoginInput!) {\n  userLogin(input: $input)\n}"): (typeof documents)["mutation UserLogin($input: UserLoginInput!) {\n  userLogin(input: $input)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UserLogout {\n  userLogout\n}"): (typeof documents)["mutation UserLogout {\n  userLogout\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UserSignUp($input: UserSignupInput!) {\n  userSignUp(input: $input)\n}"): (typeof documents)["mutation UserSignUp($input: UserSignupInput!) {\n  userSignUp(input: $input)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetUserProfile {\n  getUserProfile {\n    _id\n    createdAt\n    email\n    name\n    updatedAt\n  }\n}"): (typeof documents)["query GetUserProfile {\n  getUserProfile {\n    _id\n    createdAt\n    email\n    name\n    updatedAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;