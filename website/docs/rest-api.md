---
id: rest-api
title: Rest API
sidebar_label: Rest API
---

Commun provides a set of APIs for each entity and for the authenticated user.

## Authentication

In order to authenticate any request, a valid access token is needed.
See [User APIs](#user-apis) for details on how to get a valid access token.

Add a header field to the request with key `Authorization` and value `Bearer <accessToken>`.

## Entity APIs

Each entity has a set of APIs that can be used to manage the items on the entity.
The **apiKey** is the attribute selected on your entity general configuration.

### [GET] /api/v1/<entityName\>

Returns a paginated list of items, where *<entityName\>* is the name of the entity.
GET permissions are checked for each item, and only those that the viewer can get will be returned.

#### Query string options

- **orderBy**: Sorts the returned items using a specific attribute and a direction.
For example `orderBy=attr:asc` or `orderBy=attr:desc`.    
  
- **filter**: Filters the returned items using specific values for one or more attributes.
For example `filter=attr1:bar` or `filter=attr1:bar;attr2:foo`.

- **populate**: Populates an item from a referenced entity.
For example `populate=user` will return the data from the referenced user.

- **first**: Limits the number of items returned per page. For example `first=10`.

- **last**: Skips a given number of items; For example `last=10`.

- **before**: Returns only the items before the given cursor. For example `before=<cursor>`.

- **after**: Returns only the items after the given cursor. For example `after=<cursor>`.

### [POST] /api/v1/<entityName\>

Creates a new item using the data in the request body.
The request will succeed only if the viewer has the correct CREATE permissions.

### [GET] /api/v1/<entityName\>/<apiKey\>

Returns a single item given its ID or the value for the selected *apiKey* attribute.
The request will succeed only if the viewer has the correct GET permissions.

#### Query string options

- **populate**: Populates an item from a referenced entity.
For example `populate=user` will return the data from the referenced user.

### [PUT] /api/v1/<entityName\>/<apiKey\>

Updates a single item using the data in the request body.
The request will succeed only if the viewer has the correct UPDATE permissions.

### [DELETE] /api/v1/<entityName\>/<apiKey\>

Deletes a single item using the data in the request body.
The request will succeed only if the viewer has the correct DELETE permissions.

## User APIs

Commun users are a special type of entity.
All the entity APIs can be used with users, where **entityName** is user and **apiKey** is username.
In top of those APIs, these other APIs are provided:

### [POST] /api/v1/auth/password
 
Creates a new user given an email, username and password.
The fields `email`, `username` and `password` must be sent in the body of the request.

After the user is created, Commun sends an email with a code to verify the user's email.

### [POST] /api/v1/auth/password/login

Authenticates an user given the email or username and the password.
The fields `username` and `password` must be sent in the body of the request.
`username` accepts an username or an email.

Returns the refresh and access token.

### [POST] /api/v1/auth/token

Returns an access token given an username and a valid refresh token.
The fields `username` and `refreshToken` must be sent in the body of the request.

### [POST] /api/v1/auth/verify

Verifies an user's email given an username and the code sent after registration.
The fields `username` and `code` must be sent in the body of the request.

### [POST] /api/v1/auth/password/forgot

Sends a forgot password code by email given an username.
The field `username` must be sent in the body of the request.

### [POST] /api/v1/auth/password/reset
 
Allows to change a password, given an username and a valid forgot password code.
The fields `username` and `code` must be sent in the body of the request.
