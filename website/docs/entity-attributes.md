---
id: entity-attributes
title: Entity Attributes
sidebar_label: Entity Attributes
---

Attributes define the data that items in the entity can store.
Every entity comes with three attributes: `ID`, `createdAt` and `updatedAt`.
There are no limits in the number of attributes that each entity can have.

### Required attributes

Each attribute can specify whether it is required or not.
New items must contain values for all required attributes, otherwise the creation fails with an error explaining which
attributes are missing. 

### Unique attributes

The value of an attribute marked as unique can only exist once within the entity.
A MongoDB index is created for every attribute marked as unique.

## Attribute Type

### Boolean attributes

Boolean attributes can only store the values `true` or `false`.
The value will be stored and returned as a native JSON boolean type. 

### Date attributes

Date attributes accept a date in the following formats:

- An integer value representing the number of milliseconds since January 1, 1970, 00:00:00 UTC.
- A string value representing a date, specified in a format recognized by the JavaScript Date.parse() method.

The value of a date attribute is returned as a string in simplified extended ISO format
([ISO 8601](http://en.wikipedia.org/wiki/ISO_8601)), which is always 24 or 27 characters long. The timezone is always
zero UTC offset.

### Email attributes

Email attributes only accept strings containing valid email addresses.

### Enum attributes

In enum attributes a list of accepted values can be specified. 
Only values in the list will be accepted when creating an item.

### List attributes

List attributes accept an array of values.
In list attributes a List Type can be set. Arrays are only accepted if every element in the array has the specified type.

### Map attributes

Map attributes accept an object with key-value pairs.
The type of the key and the attribute can be specified. Maps are only accepted if every key and value respect the specified types.

### Number attributes

Number attributes only accept native JSON numbers.
Optionally, the minimum and maximum accepted values can be set. Only numbers in that range will be accepted.

### Entity Reference attributes

Entity reference attributes accept IDs for items belonging to the same or a different entity.

When fetching data using the **Rest API**, the `populate` query parameter can be used to fetch the referenced item.
For example, the user of an item can be fetched with the API `/api/v1/<entity>/<id>?populate=user`.

When fetching data using **GraphQL**, the referenced item can be fetched using a sub selection.
For example, the user of an item can be fetched with the query `item { user { email, username, ... } }`

### Slug attributes

Slug attributes allow to create an URL friendly value from a different attribute.
These attributes are useful to create SEO friendly URLs.

In order to create a slug attribute you need to select a string type attribute from which the slug will be generated.
Optionally, you can set random prefixes and/or suffixes to be added to the generated attribute.

For example, if a slug is generated from a `title` attribute with a random suffix of 8 characters,
and the item's title is `Sample Title`, the resulting slug will look like `sample-title-e32643b3`.

### String attributes

String attributes accept only native JSON strings.
Optionally, a maximum length can be set, in which case values with more characters than the defined number will be rejected.

String attributes support a **Hash** setting.
Enabling this setting will hash the given string using the selected algorithm.
After the string is hashed, the original value cannot be recovered.
By default user passwords and tokens are stored using this setting.

### User attributes

User attributes are a special type of Entity Reference attributes.
When creating an item, this attribute will be automatically fill with the authenticated user ID.

This attribute is useful to store the user who created the resource.
It allows the [own permission](/docs/entity-permissions#the-user-who-owns-the-resource) to be set on the entity.
