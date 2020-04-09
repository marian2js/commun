---
id: rest-api
title: Rest API
sidebar_label: Rest API
---

Commun provides a set of APIs for each entity and for the authenticated user.

## Entity APIs

Each entity has a set of APIs that can be used to manage the items on the entity.
The **apiKey** is the attribute selected on your entity general configuration.

### [GET] /api/v1/<entityName\>

Returns a paginated list of items, where *<entityName\>* is the name of the entity.
GET permissions are checked for each item, and only those that the viewer can get will be returned.

#### Query string options

- **sort**: Sorts the returned items using a specific attribute and a direction.
For example `sort=attr:asc` or `sort=attr:desc`.    
  
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
